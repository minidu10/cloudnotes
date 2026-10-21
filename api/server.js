const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/cloudnotes";

mongoose
  .connect(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch((err) => {
    console.error("Cannot connect to MongoDB:", err.message);
    process.exit(1);
  });
