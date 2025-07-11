const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // All user admin routes require authentication
router.use(authorize('admin')); // All these routes require 'admin' role

// Add specific routes FIRST before parameterized routes
router.get('/dashboard/stats', userController.getDashboardStats);

// Password reset route - must be before /:id route
router.patch('/:userId/reset-password', userController.resetUserPassword);

// General CRUD routes AFTER specific routes
router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
