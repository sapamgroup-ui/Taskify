const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, role, location, skills } = req.body;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message || 'Error creating auth user' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
        phone: phone || '',
        role: role || 'both',
        location: location || {},
        skills: skills || [],
        avatar: '',
        bio: '',
        verified: false,
        rating: 0,
        total_reviews: 0,
        completed_tasks: 0,
        earning: 0,
        spent: 0,
        upi_id: '',
        bank_details: {},
        is_business: false,
        business_name: '',
        business_type: ''
      })
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ success: false, message: profileError.message });
    }

    const token = generateToken(profile.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        location: profile.location,
        skills: profile.skills,
        avatar: profile.avatar,
        bio: profile.bio,
        verified: profile.verified,
        rating: profile.rating,
        total_reviews: profile.total_reviews,
        completed_tasks: profile.completed_tasks,
        earning: profile.earning,
        spent: profile.spent,
        upi_id: profile.upi_id,
        is_business: profile.is_business,
        business_name: profile.business_name,
        business_type: profile.business_type,
        created_at: profile.created_at
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { data: user, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !user) {
      return res.status(401).json({ success: false, message: 'User profile not found' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        skills: user.skills,
        avatar: user.avatar,
        bio: user.bio,
        verified: user.verified,
        rating: user.rating,
        total_reviews: user.total_reviews,
        completed_tasks: user.completed_tasks,
        earning: user.earning,
        spent: user.spent,
        upi_id: user.upi_id,
        is_business: user.is_business,
        business_name: user.business_name,
        business_type: user.business_type,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      skills: user.skills,
      avatar: user.avatar,
      bio: user.bio,
      verified: user.verified,
      rating: user.rating,
      total_reviews: user.total_reviews,
      completed_tasks: user.completed_tasks,
      earning: user.earning,
      spent: user.spent,
      upi_id: user.upi_id,
      is_business: user.is_business,
      business_name: user.business_name,
      business_type: user.business_type,
      created_at: user.created_at
    } });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'bio', 'location', 'skills', 'role',
      'upiId', 'bankDetails', 'isBusiness', 'businessName', 'businessType'
    ];
    const updates = {};
    const fieldMap = {
      upiId: 'upi_id',
      bankDetails: 'bank_details',
      isBusiness: 'is_business',
      businessName: 'business_name',
      businessType: 'business_type'
    };

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbField = fieldMap[field] || field;
        updates[dbField] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUser(req.user.id, {
      password: newPassword
    });

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const token = generateToken(req.user.id);
    res.json({ success: true, message: 'Password updated successfully', token });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ success: false, message: 'Server error changing password' });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
