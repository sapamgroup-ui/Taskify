const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getSubscription, createSubscription } = require('../controllers/subscriptionController');

router.get('/me', auth, getSubscription);

router.post('/', auth, createSubscription);

module.exports = router;
