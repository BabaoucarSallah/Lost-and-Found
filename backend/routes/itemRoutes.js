const express = require("express");
const router = express.Router();

const { createLostItem, getAllLostItems } = require("../controllers/itemController");

// Submit new lost item
router.post("/lost-items", createLostItem);

// Get all lost items
router.get("/lost-items", getAllLostItems);

module.exports = router;
