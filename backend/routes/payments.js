const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  createOrder, verifyPayment, getPaymentHistory, refundPayment
} = require('../controllers/paymentController');

router.post('/create-order', auth, [
  body('taskId').notEmpty().withMessage('Task ID is required'),
  body('amount').isNumeric().withMessage('Valid amount is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').optional().isIn(['upi', 'gpay', 'card', 'netbanking']).withMessage('Valid payment method required')
], createOrder);

router.post('/verify', auth, [
  body('razorpayOrderId').notEmpty().withMessage('Order ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Signature is required'),
  body('paymentId').notEmpty().withMessage('Payment record ID is required')
], verifyPayment);

router.get('/history', auth, getPaymentHistory);

router.post('/:paymentId/refund', auth, [
  body('reason').optional().trim()
], refundPayment);

module.exports = router;
