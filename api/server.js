const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/cloudnotes";

const Note = mongoose.model(
  "Note",
  new mongoose.Schema({ text: String }, { timestamps: true })
);

// Health check - DevOps tools use this to know if the app is OK
app.get("/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "db down" });
});

app.get("/api/notes", async (req, res) => {
  const notes = await Note.find().sort({ createdAt: -1 });
  res.json(notes);
});

app.post("/api/notes", async (req, res) => {
  if (!req.body.text) {
    return res.status(400).json({ error: "text is required" });
  }
  const note = await Note.create({ text: req.body.text });
  res.status(201).json(note);
});

mongoose
  .connect(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch((err) => {
    console.error("Cannot connect to MongoDB:", err.message);
    process.exit(1);
  });