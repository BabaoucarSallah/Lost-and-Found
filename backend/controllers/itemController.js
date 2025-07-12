const db = require("../config/db");

const createLostItem = (req, res) => {
  const { itemName, description, location, dateLost, contact } = req.body;

  if (!itemName || !contact) {
    return res.status(400).json({ error: "itemName and contact are required." });
  }

  const query = `
    INSERT INTO lost_items (itemName, description, location, dateLost, contact)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [itemName, description, location, dateLost, contact], function (err) {
    if (err) {
      console.error("❌ DB Error:", err.message);
      return res.status(500).json({ error: "Database error." });
    }
    res.status(201).json({ message: "Lost item added", id: this.lastID });
  });
};

module.exports = { createLostItem };


const getAllLostItems = (req, res) => {
  const query = `SELECT * FROM lost_items ORDER BY id DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ DB Error:", err.message);
      return res.status(500).json({ error: "Database error." });
    }

    res.status(200).json(rows);
  });

  console.log("🔍 GET /api/lost-items was called");

};

module.exports = {
  createLostItem,
  getAllLostItems
};

