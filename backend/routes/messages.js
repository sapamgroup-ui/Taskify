const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  sendMessage, getConversations, getMessages, markAsRead
} = require('../controllers/messageController');

router.get('/conversations', auth, getConversations);

router.get('/:taskId/:userId', auth, getMessages);

router.post('/', auth, [
  body('taskId').notEmpty().withMessage('Task ID is required'),
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('content').trim().notEmpty().withMessage('Message content is required')
], sendMessage);

router.put('/:taskId/:senderId/read', auth, markAsRead);

module.exports = router;
