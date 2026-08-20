const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { uploadTaskPhotos } = require('../middleware/upload');
const {
  createTask, getAllTasks, getTaskById, updateTask, deleteTask,
  acceptOffer, askQuestion, answerQuestion, updateTaskStatus,
  getMyPostedTasks, getMyAcceptedTasks
} = require('../controllers/taskController');

router.get('/', getAllTasks);

router.get('/my-posted', auth, getMyPostedTasks);

router.get('/my-accepted', auth, getMyAcceptedTasks);

router.get('/:id', getTaskById);

router.post('/', auth, uploadTaskPhotos, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
], createTask);

router.put('/:id', auth, uploadTaskPhotos, updateTask);

router.delete('/:id', auth, deleteTask);

router.post('/:id/accept-offer/:offerId', auth, acceptOffer);

router.post('/:id/questions', auth, [
  body('question').trim().notEmpty().withMessage('Question is required')
], askQuestion);

router.post('/:id/questions/:questionId/answer', auth, [
  body('answer').trim().notEmpty().withMessage('Answer is required')
], answerQuestion);

router.put('/:id/status', auth, [
  body('status').isIn(['in_progress', 'completed', 'cancelled', 'disputed']).withMessage('Valid status is required')
], updateTaskStatus);

module.exports = router;
