const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { requestVerification, getMyVerification, adminReviewRequest, getPendingRequests } = require('../controllers/verificationController');

router.post('/request', auth, requestVerification);
router.get('/me', auth, getMyVerification);
router.get('/pending', auth, adminAuth, getPendingRequests);
router.put('/:id/review', auth, adminAuth, adminReviewRequest);

module.exports = router;
