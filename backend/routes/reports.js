const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  createReport, getMyReports, getAllReports, updateReportStatus
} = require('../controllers/reportController');

router.post('/', auth, [
  body('reportedUserId').notEmpty().withMessage('Reported user ID is required'),
  body('reason').isIn(['spam', 'fraud', 'inappropriate', 'harassment', 'fake_profile', 'payment_issue', 'other']).withMessage('Valid reason is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
], createReport);

router.get('/my', auth, getMyReports);

router.get('/all', auth, getAllReports);

router.put('/:id/status', auth, [
  body('status').isIn(['pending', 'reviewed', 'resolved', 'dismissed']).withMessage('Valid status is required')
], updateReportStatus);

module.exports = router;
