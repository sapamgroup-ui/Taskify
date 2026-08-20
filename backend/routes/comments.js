const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');

router.get('/tasks/:taskId/comments', getComments);

router.post('/tasks/:taskId/comments', auth, addComment);

router.delete('/comments/:id', auth, deleteComment);

module.exports = router;
