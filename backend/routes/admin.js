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

router.get('/seed-admin', async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    const bcrypt = require('bcryptjs');

    const email = 'admin@alltasker.com';
    const password = 'admin123';

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, message: 'Admin already exists', userId: existing.id });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ success: false, message: 'Auth error: ' + authError.message, code: authError.code });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: 'Admin',
        email,
        phone: '9999999999',
        role: 'admin',
        location: {},
        skills: [],
        avatar: '',
        bio: 'Platform Administrator',
        verified: true,
        verified_at: new Date().toISOString(),
        verification_status: 'approved',
        rating: 0,
        total_reviews: 0,
        completed_tasks: 0,
        earning: 0,
        spent: 0,
        upi_id: '',
        bank_details: {},
        is_business: false,
        business_name: '',
        business_type: '',
        blocked: false
      });

    if (profileError) {
      return res.status(400).json({ success: false, message: 'Profile error: ' + profileError.message });
    }

    res.json({ success: true, message: 'Admin created successfully', userId: authData.user.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
