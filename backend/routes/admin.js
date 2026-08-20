const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getStats, getUsers, getTasks, getReports,
  blockUser, unblockUser, resolveReport,
  assignSubscription, getPendingVerifications, reviewVerification,
  getSubscriptions
} = require('../controllers/adminController');

router.get('/stats', adminAuth, getStats);
router.get('/users', adminAuth, getUsers);
router.get('/tasks', adminAuth, getTasks);
router.get('/reports', adminAuth, getReports);
router.get('/subscriptions', adminAuth, getSubscriptions);
router.get('/verifications', adminAuth, getPendingVerifications);

router.put('/users/:userId/block', adminAuth, blockUser);
router.put('/users/:userId/unblock', adminAuth, unblockUser);
router.put('/users/:userId/subscription', adminAuth, assignSubscription);
router.put('/reports/:reportId', adminAuth, resolveReport);
router.put('/verifications/:id', adminAuth, reviewVerification);

module.exports = router;
