const supabase = require('../config/supabase');

const createReview = async (req, res) => {
  try {
    const { taskId, rating, comment } = req.body;

    if (!taskId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Task ID, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed tasks' });
    }

    const isPoster = task.poster_id === req.user.id;
    const isAssigned = task.assigned_to && task.assigned_to === req.user.id;

    if (!isPoster && !isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this task' });
    }

    if (!task.assigned_to) {
      return res.status(400).json({ success: false, message: 'Task has no assigned tasker to review' });
    }

    const reviewee = isPoster ? task.assigned_to : task.poster_id;

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('task_id', taskId)
      .eq('reviewer_id', req.user.id)
      .single();

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this task' });
    }

    const { data: pairReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('task_id', taskId)
      .eq('reviewer_id', reviewee)
      .eq('reviewee_id', req.user.id)
      .maybeSingle();

    if (pairReview) {
      return res.status(400).json({ success: false, message: 'A review already exists between you and this user for this task' });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        task_id: taskId,
        reviewer_id: req.user.id,
        reviewee_id: reviewee,
        rating,
        comment
      })
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar), reviewee:profiles!reviews_reviewee_id_fkey(id, name, avatar)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('CreateReview error:', error);
    res.status(500).json({ success: false, message: 'Server error creating review' });
  }
};

const getReviewsForUser = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar), task:tasks(id, title, category)', { count: 'exact' })
      .eq('reviewee_id', req.params.userId)
      .order('created_at', { ascending: false });

    query = query.range(skip, skip + Number(limit) - 1);

    const { data: reviews, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', req.params.userId);

    let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let reviewCount = 0;

    if (allReviews && allReviews.length > 0) {
      allReviews.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        totalRating += r.rating;
        reviewCount++;
      });
    }

    const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

    res.json({
      success: true,
      reviews: reviews || [],
      stats: {
        averageRating,
        totalReviews: reviewCount,
        distribution
      },
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetReviewsForUser error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

const getReviewsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('reviews')
      .select('*, reviewee:profiles!reviews_reviewee_id_fkey(id, name, avatar), task:tasks(id, title, category)', { count: 'exact' })
      .eq('reviewer_id', req.params.userId)
      .order('created_at', { ascending: false });

    query = query.range(skip, skip + Number(limit) - 1);

    const { data: reviews, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    res.json({
      success: true,
      reviews: reviews || [],
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetReviewsByUser error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ success: false, message: 'Response is required' });
    }

    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.reviewee_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the reviewee can respond' });
    }

    if (review.response) {
      return res.status(400).json({ success: false, message: 'You have already responded to this review' });
    }

    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({ response })
      .eq('id', reviewId)
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('RespondToReview error:', error);
    res.status(500).json({ success: false, message: 'Server error responding to review' });
  }
};

module.exports = { createReview, getReviewsForUser, getReviewsByUser, respondToReview };
