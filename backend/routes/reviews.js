const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createReview, getReviewsForUser, getReviewsByUser, respondToReview
} = require('../controllers/reviewController');

router.get('/user/:userId', getReviewsForUser);

router.get('/by/:userId', getReviewsByUser);

router.post('/', auth, [
  body('taskId').notEmpty().withMessage('Task ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Comment is required')
], createReview);

router.post('/:reviewId/respond', auth, [
  body('response').trim().notEmpty().withMessage('Response is required')
], respondToReview);

module.exports = router;
