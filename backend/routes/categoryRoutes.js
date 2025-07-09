const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(categoryController.getAllCategories)
  .post(protect, authorize('admin'), categoryController.createCategory);

router
  .route('/:id')
  .get(categoryController.getCategory)
  .patch(protect, authorize('admin'), categoryController.updateCategory)
  .delete(protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;
