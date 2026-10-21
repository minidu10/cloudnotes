const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const Note = require("../note");

let mongo;

// Start a temporary in-memory MongoDB for the tests
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

// Each test starts with an empty database
afterEach(async () => {
  await Note.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

// A valid id that does not exist in the database
const missingId = new mongoose.Types.ObjectId().toString();

async function createNote(text) {
  const res = await request(app).post("/api/notes").send({ text });
  return res.body;
}

describe("GET /health", () => {
  test("returns ok when the database is connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/version", () => {
  afterEach(() => {
    delete process.env.APP_VERSION;
    delete process.env.GIT_SHA;
  });

  test("returns defaults when env vars are not set", async () => {
    delete process.env.APP_VERSION;
    delete process.env.GIT_SHA;
    const res = await request(app).get("/api/version");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ version: "dev", commit: "local" });
  });

  test("returns APP_VERSION and GIT_SHA from env vars", async () => {
    process.env.APP_VERSION = "1.2.3";
    process.env.GIT_SHA = "abc1234";
    const res = await request(app).get("/api/version");
    expect(res.body).toEqual({ version: "1.2.3", commit: "abc1234" });
  });
});

describe("GET /api/notes", () => {
  test("returns an empty list when there are no notes", async () => {
    const res = await request(app).get("/api/notes");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns all notes", async () => {
    await createNote("first");
    await createNote("second");
    const res = await request(app).get("/api/notes");
    expect(res.status).toBe(200);
    expect(res.body.map((n) => n.text).sort()).toEqual(["first", "second"]);
  });
});

describe("POST /api/notes", () => {
  test("creates a note", async () => {
    const res = await request(app).post("/api/notes").send({ text: "  hello  " });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe("hello");
    expect(res.body._id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(await Note.countDocuments()).toBe(1);
  });

  test.each([
    ["missing text", {}],
    ["empty text", { text: "" }],
    ["only spaces", { text: "   " }],
    ["text is not a string", { text: 42 }],
  ])("returns 400 for %s", async (_name, body) => {
    const res = await request(app).post("/api/notes").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("text is required");
    expect(await Note.countDocuments()).toBe(0);
  });
});

describe("PUT /api/notes/:id", () => {
  test("updates the note text", async () => {
    const note = await createNote("old text");
    const res = await request(app).put(`/api/notes/${note._id}`).send({ text: "new text" });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe("new text");
    expect(res.body._id).toBe(note._id);

    const saved = await Note.findById(note._id);
    expect(saved.text).toBe("new text");
  });

  test("returns 400 for empty text", async () => {
    const note = await createNote("keep me");
    const res = await request(app).put(`/api/notes/${note._id}`).send({ text: "  " });
    expect(res.status).toBe(400);
    expect((await Note.findById(note._id)).text).toBe("keep me");
  });

  test("returns 400 for an invalid id", async () => {
    const res = await request(app).put("/api/notes/not-an-id").send({ text: "x" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid note id");
  });

  test("returns 404 when the note does not exist", async () => {
    const res = await request(app).put(`/api/notes/${missingId}`).send({ text: "x" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("note not found");
  });
});

describe("DELETE /api/notes/:id", () => {
  test("deletes the note", async () => {
    const note = await createNote("delete me");
    const res = await request(app).delete(`/api/notes/${note._id}`);
    expect(res.status).toBe(204);
    expect(await Note.countDocuments()).toBe(0);
  });

  test("returns 400 for an invalid id", async () => {
    const res = await request(app).delete("/api/notes/123");
    expect(res.status).toBe(400);
  });

  test("returns 404 when the note does not exist", async () => {
    const res = await request(app).delete(`/api/notes/${missingId}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /metrics", () => {
  test("exposes Prometheus metrics", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toContain("process_cpu_seconds_total");
    expect(res.text).toContain("http_requests_total");
    expect(res.text).toContain("http_request_duration_seconds");
  });

  test("uses the route pattern as label, not the real id", async () => {
    const note = await createNote("metrics");
    await request(app).delete(`/api/notes/${note._id}`);

    const res = await request(app).get("/metrics");
    expect(res.text).toContain('route="/api/notes/:id"');
    expect(res.text).not.toContain(note._id);
  });
});

describe("unknown routes", () => {
  test("return 404 as JSON", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not found" });
  });
});
