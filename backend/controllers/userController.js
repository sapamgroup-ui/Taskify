const supabase = require('../config/supabase');

const getUserProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('GetUserProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'bio', 'location', 'skills', 'role',
      'upiId', 'bankDetails', 'isBusiness', 'businessName', 'businessType',
      'portfolioPhotos', 'portfolioVideoUrl', 'portfolioVideoFile',
      'workCategories', 'hourlyRate'
    ];

    const updates = {};
    const fieldMap = {
      upiId: 'upi_id',
      bankDetails: 'bank_details',
      isBusiness: 'is_business',
      businessName: 'business_name',
      businessType: 'business_type',
      portfolioPhotos: 'portfolio_photos',
      portfolioVideoUrl: 'portfolio_video_url',
      portfolioVideoFile: 'portfolio_video_file',
      workCategories: 'work_categories',
      hourlyRate: 'hourly_rate'
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
    console.error('UpdateUserProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const { data: user, error } = await supabase
      .from('profiles')
      .update({ avatar: avatarUrl })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, user, avatarUrl });
  } catch (error) {
    console.error('UploadAvatar error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading avatar' });
  }
};

const updatePortfolio = async (req, res) => {
  try {
    const allowedFields = [
      'portfolioPhotos', 'portfolioVideoUrl', 'portfolioVideoFile',
      'workCategories', 'hourlyRate'
    ];

    const updates = {};
    const fieldMap = {
      portfolioPhotos: 'portfolio_photos',
      portfolioVideoUrl: 'portfolio_video_url',
      portfolioVideoFile: 'portfolio_video_file',
      workCategories: 'work_categories',
      hourlyRate: 'hourly_rate'
    };

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbField = fieldMap[field] || field;
        updates[dbField] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid portfolio fields to update' });
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
    console.error('UpdatePortfolio error:', error);
    res.status(500).json({ success: false, message: 'Server error updating portfolio' });
  }
};

const getTaskers = async (req, res) => {
  try {
    const { page = 1, limit = 20, skill, minRating, city, search } = req.query;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .in('role', ['tasker', 'both']);

    if (skill) {
      query = query.contains('skills', [skill]);
    }

    if (minRating) {
      query = query.gte('rating', Number(minRating));
    }

    if (city) {
      query = query.ilike('location->>city', `%${city}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    query = query.order('rating', { ascending: false });

    const skip = (Number(page) - 1) * Number(limit);
    query = query.range(skip, skip + Number(limit) - 1);

    const { data: taskers, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    res.json({
      success: true,
      taskers: taskers || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('GetTaskers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching taskers' });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, avatar, bio, location, skills, rating, total_reviews, completed_tasks, is_business, business_name, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('GetPublicProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching public profile' });
  }
};

module.exports = { getUserProfile, updateUserProfile, uploadAvatar, updatePortfolio, getTaskers, getPublicProfile };
