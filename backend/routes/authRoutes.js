const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  authController.register
);
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  authController.login
);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/updateMe', protect, authController.updateMe);

module.exports = router;
