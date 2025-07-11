const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  categoryValidation,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router
  .route('/')
  .get(categoryController.getAllCategories)
  .post(
    protect,
    authorize('admin'),
    categoryValidation,
    handleValidationErrors,
    categoryController.createCategory
  );

router
  .route('/:id')
  .get(categoryController.getCategory)
  .patch(
    protect,
    authorize('admin'),
    categoryValidation,
    handleValidationErrors,
    categoryController.updateCategory
  )
  .delete(protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;
