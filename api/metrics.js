const client = require("prom-client");

// Default Node.js metrics: memory, CPU, event loop lag, garbage collection...
client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
});

// Records every request when the response is finished.
// The "route" label is the route pattern (like /api/notes/:id), never the real URL.
// Otherwise every note id would create a new time series in Prometheus.
function metricsMiddleware(req, res, next) {
  const stopTimer = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : "unmatched",
      status: res.statusCode,
    };
    httpRequestsTotal.inc(labels);
    stopTimer(labels);
  });

  next();
}

async function metricsHandler(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.send(await client.register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler };
