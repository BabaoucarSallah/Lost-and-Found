const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const itemRoutes = require("./routes/itemRoutes");
const db = require("./config/db");

// Load environment variables from .env
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // allows frontend requests
app.use(express.json()); // parses JSON request bodies

// Routes
app.use("/api", itemRoutes);

// Root route (optional test)
app.get("/", (req, res) => {
  res.send("Lost and Found API is running ✅");
});

const foundItemRoutes = require("./routes/foundItemRoutes");
app.use("/api", foundItemRoutes);


// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
