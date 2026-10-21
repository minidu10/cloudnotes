const express = require("express");
const mongoose = require("mongoose");
const Note = require("./note");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const app = express();
app.use(express.json());
app.use(metricsMiddleware);

// Health check - DevOps tools use this to know if the app is OK
app.get("/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "db down" });
});

// Prometheus metrics - internal only, nginx does NOT expose this
app.get("/metrics", metricsHandler);

// Which version is running - set by the build / deploy pipeline
app.get("/api/version", (req, res) => {
  res.json({
    version: process.env.APP_VERSION || "dev",
    commit: process.env.GIT_SHA || "local",
  });
});

// Returns the trimmed note text from the request body, or "" if missing
function getText(req) {
  const text = req.body?.text;
  return typeof text === "string" ? text.trim() : "";
}

// Rejects ids that are not a valid MongoDB ObjectId (24 hex characters)
function validateId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ error: "invalid note id" });
  }
  next();
}

app.get("/api/notes", async (req, res) => {
  const notes = await Note.find().sort({ createdAt: -1 });
  res.json(notes);
});

app.post("/api/notes", async (req, res) => {
  const text = getText(req);
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }
  const note = await Note.create({ text });
  res.status(201).json(note);
});

app.put("/api/notes/:id", validateId, async (req, res) => {
  const text = getText(req);
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }
  // new: true returns the note after the update
  const note = await Note.findByIdAndUpdate(req.params.id, { text }, { new: true });
  if (!note) {
    return res.status(404).json({ error: "note not found" });
  }
  res.json(note);
});

app.delete("/api/notes/:id", validateId, async (req, res) => {
  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) {
    return res.status(404).json({ error: "note not found" });
  }
  res.status(204).end();
});

// Any other path
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

// Errors end up here (Express 5 also catches errors thrown in async handlers)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? "internal server error" : err.message });
});

module.exports = app;
