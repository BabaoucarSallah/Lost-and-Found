const express = require('express');
const claimController = require('../controllers/claimController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // All claim routes require authentication

router
  .route('/')
  .post(claimController.createClaim)
  .get(claimController.getAllClaims); // User can get their claims/claims on their items; Admin all

router
  .route('/:id')
  .get(claimController.getClaim)
  .patch(authorize('user', 'admin'), claimController.updateClaimStatus) // Item owner or admin to approve/reject
  .delete(authorize('user', 'admin'), claimController.deleteClaim); // Claimer (if pending) or admin

// Admin-only route for general claim updates
router
  .route('/:id/admin-update')
  .patch(authorize('admin'), claimController.updateClaim); // Admin can update any claim details

module.exports = router;
