const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const {
  getUserProfile, updateUserProfile, uploadAvatar: uploadAvatarCtrl,
  getTaskers, getPublicProfile, updatePortfolio
} = require('../controllers/userController');

router.get('/taskers', getTaskers);

router.get('/:id', getUserProfile);

router.get('/:id/public', getPublicProfile);

router.put('/profile', auth, updateUserProfile);

router.post('/avatar', auth, uploadAvatar, uploadAvatarCtrl);

router.put('/portfolio', auth, updatePortfolio);

module.exports = router;
