const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  makeOffer, getOffersForTask, acceptOffer, rejectOffer, withdrawOffer
} = require('../controllers/bidController');

router.post('/:id/offers', auth, [
  body('amount').isNumeric().withMessage('Valid offer amount is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0')
], makeOffer);

router.get('/:id/offers', auth, getOffersForTask);

router.put('/:id/offers/:offerId/accept', auth, acceptOffer);

router.put('/:id/offers/:offerId/reject', auth, rejectOffer);

router.delete('/:id/offers/:offerId', auth, withdrawOffer);

module.exports = router;
