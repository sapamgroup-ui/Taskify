const supabase = require('../config/supabase');
const { validationResult } = require('express-validator');
const { transformTask, transformTasks } = require('../utils/transform');

const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let budgetMin = req.body.budget_min !== undefined ? Number(req.body.budget_min) : (req.body.budget?.min !== undefined ? Number(req.body.budget.min) : 0);
    let budgetMax = req.body.budget_max !== undefined ? Number(req.body.budget_max) : (req.body.budget?.max !== undefined ? Number(req.body.budget.max) : 0);
    let currency = req.body.budget?.currency || 'INR';
    let locationAddress = req.body.location_address !== undefined ? req.body.location_address : (req.body.location?.address || '');
    let locationCity = req.body.location_city !== undefined ? req.body.location_city : (req.body.location?.city || '');
    let locationState = req.body.location_state !== undefined ? req.body.location_state : (req.body.location?.state || '');
    let locationPincode = req.body.location_pincode !== undefined ? req.body.location_pincode : (req.body.location?.pincode || '');
    let locationLat = req.body.location_lat !== undefined ? Number(req.body.location_lat) : (req.body.location?.lat || 0);
    let locationLng = req.body.location_lng !== undefined ? Number(req.body.location_lng) : (req.body.location?.lng || 0);

    let tags = req.body.tags;
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch (e) { tags = []; }
    }

    const taskData = {
      poster_id: req.user.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || 'other',
      budget_min: budgetMin,
      budget_max: budgetMax,
      currency: currency,
      location_address: locationAddress,
      location_city: locationCity,
      location_state: locationState,
      location_pincode: locationPincode,
      location_lat: locationLat,
      location_lng: locationLng,
      scheduled_date: req.body.scheduledDate || null,
      scheduled_time: req.body.scheduledTime || '',
      deadline: req.body.deadline || null,
      tags: tags || [],
      urgency: req.body.urgency || 'normal',
      status: 'open',
      task_type: req.body.taskType || 'need_help'
    };

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (req.user.role !== 'admin') {
      const postsLimit = subData ? (subData.posts_limit === -1 ? Infinity : subData.posts_limit) : 2;
      const postsUsed = subData ? (subData.posts_used || 0) : 0;

      if (postsUsed >= postsLimit) {
        return res.status(403).json({ success: false, message: 'Free plan: 2 posts/month. Upgrade for more.' });
      }
    }

    if (req.files && req.files.length > 0) {
      taskData.photos = req.files.map(file => `/uploads/tasks/${file.filename}`);
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (subData) {
      await supabase
        .from('subscriptions')
        .update({ posts_used: postsUsed + 1 })
        .eq('id', subData.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: req.user.id,
          plan: 'free',
          posts_used: 1,
          posts_limit: 2,
          replies_used: 0,
          replies_limit: 1,
          start_date: new Date().toISOString(),
          status: 'active'
        });
    }

    const { data: poster } = await supabase
      .from('profiles')
      .select('id, name, avatar, rating')
      .eq('id', req.user.id)
      .single();

    task.poster = poster;

    res.status(201).json({ success: true, task: transformTask(task) });
  } catch (error) {
    console.error('CreateTask error:', error);
    res.status(500).json({ success: false, message: 'Server error creating task' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      taskType,
      search,
      minBudget,
      maxBudget,
      city,
      urgency,
      sortBy = 'createdAt',
      posterId
    } = req.query;

    let query = supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating, location), assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }
    if (taskType) {
      query = query.eq('task_type', taskType);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (urgency) {
      query = query.eq('urgency', urgency);
    }
    if (city) {
      query = query.ilike('location_city', `%${city}%`);
    }
    if (minBudget) {
      query = query.gte('budget_max', Number(minBudget));
    }
    if (maxBudget) {
      query = query.lte('budget_min', Number(maxBudget));
    }
    if (search) {
      const words = search.trim().split(/\s+/).filter(w => w.length >= 2)
      if (words.length > 0) {
        const conditions = words.map(w => `title.ilike.%${w}%,description.ilike.%${w}%,category.ilike.%${w}%`)
        query = query.or(conditions.join(','))
      }
    }
    if (posterId) {
      query = query.eq('poster_id', posterId);
    }

    if (sortBy === 'budget_high') {
      query = query.order('budget_max', { ascending: false });
    } else if (sortBy === 'budget_low') {
      query = query.order('budget_min', { ascending: true });
    } else if (sortBy === 'deadline') {
      query = query.order('deadline', { ascending: true, nullsFirst: false });
    } else if (sortBy === 'rating') {
      query = query.order('poster!tasks_poster_id_fkey(rating)', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const skip = (Number(page) - 1) * Number(limit);
    query = query.range(skip, skip + Number(limit) - 1);

    const { data: tasks, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    res.json({
      success: true,
      tasks: transformTasks(tasks || []),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('GetAllTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tasks' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating, location, bio, completed_tasks, phone, total_reviews),
        assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating, location, bio, completed_tasks, phone, total_reviews)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { data: offers } = await supabase
      .from('offers')
      .select('*, tasker:profiles!offers_tasker_id_fkey(id, name, avatar, rating, skills, completed_tasks, total_reviews)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });

    const { data: questions } = await supabase
      .from('questions')
      .select('*, user:profiles!questions_user_id_fkey(id, name, avatar)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });

    task.offers = offers || [];
    task.questions = questions || [];

    res.json({ success: true, task: transformTask(task) });
  } catch (error) {
    console.error('GetTaskById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (existingTask.poster_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    if (existingTask.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Can only edit tasks with open status' });
    }

    const allowedUpdates = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      urgency: req.body.urgency,
      scheduled_time: req.body.scheduledTime,
      deadline: req.body.deadline,
      tags: req.body.tags
    };

    if (req.body.budget) {
      if (req.body.budget.min !== undefined) allowedUpdates.budget_min = Number(req.body.budget.min);
      if (req.body.budget.max !== undefined) allowedUpdates.budget_max = Number(req.body.budget.max);
      if (req.body.budget.currency) allowedUpdates.currency = req.body.budget.currency;
    }
    if (req.body.budget_min !== undefined) allowedUpdates.budget_min = Number(req.body.budget_min);
    if (req.body.budget_max !== undefined) allowedUpdates.budget_max = Number(req.body.budget_max);

    if (req.body.location) {
      if (req.body.location.address !== undefined) allowedUpdates.location_address = req.body.location.address;
      if (req.body.location.city !== undefined) allowedUpdates.location_city = req.body.location.city;
      if (req.body.location.state !== undefined) allowedUpdates.location_state = req.body.location.state;
      if (req.body.location.pincode !== undefined) allowedUpdates.location_pincode = req.body.location.pincode;
      if (req.body.location.lat !== undefined) allowedUpdates.location_lat = req.body.location.lat;
      if (req.body.location.lng !== undefined) allowedUpdates.location_lng = req.body.location.lng;
    }
    if (req.body.location_address !== undefined) allowedUpdates.location_address = req.body.location_address;
    if (req.body.location_city !== undefined) allowedUpdates.location_city = req.body.location_city;
    if (req.body.location_state !== undefined) allowedUpdates.location_state = req.body.location_state;
    if (req.body.location_pincode !== undefined) allowedUpdates.location_pincode = req.body.location_pincode;
    if (req.body.location_lat !== undefined) allowedUpdates.location_lat = Number(req.body.location_lat);
    if (req.body.location_lng !== undefined) allowedUpdates.location_lng = Number(req.body.location_lng);

    if (req.body.scheduledDate !== undefined) {
      allowedUpdates.scheduled_date = req.body.scheduledDate;
    }

    const updates = {};
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] !== undefined) {
        updates[key] = allowedUpdates[key];
      }
    });

    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => `/uploads/tasks/${file.filename}`);
      updates.photos = [...(existingTask.photos || []), ...newPhotos];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const { data: poster } = await supabase
      .from('profiles')
      .select('id, name, avatar, rating')
      .eq('id', req.user.id)
      .single();

    task.poster = poster;

    res.json({ success: true, task: transformTask(task) });
  } catch (error) {
    console.error('UpdateTask error:', error);
    res.status(500).json({ success: false, message: 'Server error updating task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.poster_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    if (task.status === 'assigned' || task.status === 'in_progress') {
      return res.status(400).json({ success: false, message: 'Cannot delete assigned or in-progress tasks' });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('DeleteTask error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting task' });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.poster_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only task poster can accept offers' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Task is not open for offers' });
    }

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .eq('task_id', task.id)
      .single();

    if (offerError || !offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offerId);

    await supabase
      .from('offers')
      .update({ status: 'rejected' })
      .eq('task_id', task.id)
      .neq('id', offerId)
      .eq('status', 'pending');

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_to: offer.tasker_id,
        status: 'assigned'
      })
      .eq('id', task.id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const { data: poster } = await supabase
      .from('profiles')
      .select('id, name, avatar, rating')
      .eq('id', task.poster_id)
      .single();

    const { data: assignedUser } = await supabase
      .from('profiles')
      .select('id, name, avatar, rating')
      .eq('id', offer.tasker_id)
      .single();

    const { data: allOffers } = await supabase
      .from('offers')
      .select('*, tasker:profiles!offers_tasker_id_fkey(id, name, avatar, rating)')
      .eq('task_id', task.id);

    updatedTask.poster = poster;
    updatedTask.assignedTo = assignedUser;
    updatedTask.offers = allOffers || [];

    res.json({ success: true, task: transformTask(updatedTask) });
  } catch (error) {
    console.error('AcceptOffer error:', error);
    res.status(500).json({ success: false, message: 'Server error accepting offer' });
  }
};

const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { data: newQuestion, error } = await supabase
      .from('questions')
      .insert({
        task_id: task.id,
        user_id: req.user.id,
        question
      })
      .select('*, user:profiles!questions_user_id_fkey(id, name, avatar)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('*, user:profiles!questions_user_id_fkey(id, name, avatar)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });

    task.questions = questions || [];
    task.poster = { id: task.poster_id };

    res.json({ success: true, task: transformTask(task) });
  } catch (error) {
    console.error('AskQuestion error:', error);
    res.status(500).json({ success: false, message: 'Server error adding question' });
  }
};

const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ success: false, message: 'Answer is required' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.poster_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only task poster can answer questions' });
    }

    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('task_id', task.id)
      .single();

    if (qError || !question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const { error: updateError } = await supabase
      .from('questions')
      .update({ answer })
      .eq('id', questionId);

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('*, user:profiles!questions_user_id_fkey(id, name, avatar)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });

    task.questions = questions || [];
    task.poster = { id: task.poster_id };

    res.json({ success: true, task: transformTask(task) });
  } catch (error) {
    console.error('AnswerQuestion error:', error);
    res.status(500).json({ success: false, message: 'Server error answering question' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isPoster = task.poster_id === req.user.id;
    const isAssigned = task.assigned_to && task.assigned_to === req.user.id;

    if (!isPoster && !isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update task status' });
    }

    const validTransitions = {
      open: ['cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'disputed'],
      completed: ['disputed'],
      disputed: ['completed', 'cancelled']
    };

    if (!validTransitions[task.status] || !validTransitions[task.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${task.status} to ${status}`
      });
    }

    const updates = { status };

    if (status === 'cancelled') {
      updates.assigned_to = null;
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    if (status === 'cancelled') {
      await supabase
        .from('offers')
        .update({ status: 'pending' })
        .eq('task_id', task.id)
        .eq('status', 'rejected');
    }

    if (status === 'completed' && task.assigned_to) {
      const budgetMax = Number(task.budget_max);

      const { data: posterProfile } = await supabase
        .from('profiles')
        .select('spent')
        .eq('id', task.poster_id)
        .single();

      if (posterProfile) {
        await supabase
          .from('profiles')
          .update({ spent: Number(posterProfile.spent) + budgetMax })
          .eq('id', task.poster_id);
      }

      const { data: assigneeProfile } = await supabase
        .from('profiles')
        .select('earning, completed_tasks')
        .eq('id', task.assigned_to)
        .single();

      if (assigneeProfile) {
        await supabase
          .from('profiles')
          .update({
            earning: Number(assigneeProfile.earning) + budgetMax,
            completed_tasks: Number(assigneeProfile.completed_tasks) + 1
          })
          .eq('id', task.assigned_to);
      }
    }

    const { data: poster } = await supabase
      .from('profiles')
      .select('id, name, avatar, rating')
      .eq('id', updatedTask.poster_id)
      .single();

    let assignedUser = null;
    if (updatedTask.assigned_to) {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, avatar, rating')
        .eq('id', updatedTask.assigned_to)
        .single();
      assignedUser = data;
    }

    updatedTask.poster = poster;
    updatedTask.assignedTo = assignedUser;

    res.json({ success: true, task: transformTask(updatedTask) });
  } catch (error) {
    console.error('UpdateTaskStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating task status' });
  }
};

const getMyPostedTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = supabase
      .from('tasks')
      .select('*, assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)', { count: 'exact' })
      .eq('poster_id', req.user.id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const skip = (Number(page) - 1) * Number(limit);
    query = query.range(skip, skip + Number(limit) - 1);

    const { data: tasks, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    const tasksWithOffers = await Promise.all((tasks || []).map(async (task) => {
      const { data: offers } = await supabase
        .from('offers')
        .select('*, tasker:profiles!offers_tasker_id_fkey(id, name, avatar, rating)')
        .eq('task_id', task.id);
      task.offers = offers || [];
      return task;
    }));

    res.json({
      success: true,
      tasks: transformTasks(tasksWithOffers),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetMyPostedTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching posted tasks' });
  }
};

const getMyAcceptedTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating, location)', { count: 'exact' })
      .eq('assigned_to', req.user.id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const skip = (Number(page) - 1) * Number(limit);
    query = query.range(skip, skip + Number(limit) - 1);

    const { data: tasks, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    res.json({
      success: true,
      tasks: transformTasks(tasks || []),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetMyAcceptedTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching accepted tasks' });
  }
};

module.exports = {
  createTask, getAllTasks, getTaskById, updateTask, deleteTask,
  acceptOffer, askQuestion, answerQuestion, updateTaskStatus,
  getMyPostedTasks, getMyAcceptedTasks
};
