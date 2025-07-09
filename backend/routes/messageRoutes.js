const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // All message routes require authentication

router
  .route('/')
  .post(messageController.sendMessage)
  .get(messageController.getConversations);

router.get(
  '/conversation/:participantId',
  messageController.getConversationWithUser
);
router.patch('/:id/read', messageController.markMessageAsRead);

module.exports = router;
