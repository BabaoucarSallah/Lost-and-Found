const express = require("express");
const router = express.Router();

const {
  createFoundItem,
  getAllFoundItems
} = require("../controllers/foundItemController");

router.post("/found-items", createFoundItem);
router.get("/found-items", getAllFoundItems);

module.exports = router;
