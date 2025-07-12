const db = require("../config/db");

const createFoundItem = (req, res) => {
  const { itemName, description, location, dateFound, contact } = req.body;

  if (!itemName || !contact) {
    return res.status(400).json({ error: "itemName and contact are required." });
  }

  const query = `
    INSERT INTO found_items (itemName, description, location, dateFound, contact)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [itemName, description, location, dateFound, contact], function (err) {
    if (err) {
      return res.status(500).json({ error: "Database error." });
    }

    res.status(201).json({ message: "Found item added", id: this.lastID });
  });
};

const getAllFoundItems = (req, res) => {
  const query = `SELECT * FROM found_items ORDER BY id DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error." });
    }

    res.status(200).json(rows);
  });
};

module.exports = { createFoundItem, getAllFoundItems };
