const express = require('express');
const itemController = require('../controllers/itemController');
const {
  protect,
  authorize,
  optionalAuth,
} = require('../middlewares/authMiddleware');
const { uploadItemImage } = require('../middlewares/uploadMiddleware'); // For image uploads
const {
  itemValidation,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router
  .route('/')
  .get(optionalAuth, itemController.getAllItems) // Optional auth to support "my" parameter
  .post(
    protect,
    uploadItemImage,
    itemValidation,
    handleValidationErrors,
    itemController.createItem
  ); // Authenticated users can create

router
  .route('/:id')
  .get(itemController.getItem)
  .patch(
    protect,
    uploadItemImage,
    itemValidation,
    handleValidationErrors,
    itemController.updateItem
  ) // Owner or admin
  .delete(protect, itemController.deleteItem); // Owner or admin

router.get('/:itemId/matches', itemController.suggestMatches); // Public or authenticated

module.exports = router;
