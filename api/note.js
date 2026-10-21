const mongoose = require("mongoose");

// timestamps: true adds createdAt and updatedAt automatically
const noteSchema = new mongoose.Schema(
  { text: { type: String, required: true, trim: true } },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
