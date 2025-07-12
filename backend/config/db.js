const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create or connect to SQLite database file
const db = new sqlite3.Database(path.resolve(__dirname, "../lostandfound.db"), (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// Create lost_items table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS lost_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemName TEXT NOT NULL,
    description TEXT,
    location TEXT,
    dateLost TEXT,
    contact TEXT
  )
`);

// Create found_items table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS found_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemName TEXT NOT NULL,
    description TEXT,
    location TEXT,
    dateFound TEXT,
    contact TEXT
  )
`);


module.exports = db;
