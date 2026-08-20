const supabase = require('../config/supabase');

const getStats = async (req, res) => {
  try {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    const { count: activeTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open');
    const { count: completedTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed');

    const { data: payments } = await supabase.from('payments').select('amount');
    const totalRevenue = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    res.json({
      success: true,
      totalUsers: totalUsers || 0,
      totalTasks: totalTasks || 0,
      activeTasks: activeTasks || 0,
      completedTasks: completedTasks || 0,
      totalRevenue
    });
  } catch (error) {
    console.error('AdminGetStats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, users: users || [] });
  } catch (error) {
    console.error('AdminGetUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar), assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar)')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, tasks: tasks || [] });
  } catch (error) {
    console.error('AdminGetTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getReports = async (req, res) => {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(id, name, avatar)')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, reports: reports || [] });
  } catch (error) {
    console.error('AdminGetReports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabase.from('profiles').update({ blocked: true }).eq('id', userId);
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    console.error('AdminBlockUser error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabase.from('profiles').update({ blocked: false }).eq('id', userId);
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('AdminUnblockUser error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    const { error } = await supabase.from('reports').update({ status, resolved_by: req.user.id }).eq('id', reportId);
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Report updated' });
  } catch (error) {
    console.error('AdminResolveReport error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const assignSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!plan || !['free', 'per_reply', 'basic', 'premium'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const planConfig = {
      free: { replies_limit: 1, posts_limit: 2 },
      per_reply: { replies_limit: 1, posts_limit: 0 },
      basic: { replies_limit: 7, posts_limit: 7 },
      premium: { replies_limit: -1, posts_limit: -1 }
    };
    const cfg = planConfig[plan];
    const now = new Date();

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('subscriptions')
        .update({
          plan,
          replies_limit: cfg.replies_limit,
          posts_limit: cfg.posts_limit,
          replies_used: 0,
          posts_used: 0,
          start_date: now.toISOString(),
          end_date: plan === 'free' || plan === 'per_reply' ? null : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
          status: 'active'
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, subscription: updated });
    }

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        replies_used: 0,
        replies_limit: cfg.replies_limit,
        posts_used: 0,
        posts_limit: cfg.posts_limit,
        start_date: now.toISOString(),
        end_date: plan === 'free' || plan === 'per_reply' ? null : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, subscription: sub });
  } catch (error) {
    console.error('AdminAssignSubscription error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPendingVerifications = async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*, user:profiles!verification_requests_user_id_fkey(id, name, avatar, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, requests: requests || [] });
  } catch (error) {
    console.error('AdminGetPendingVerifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const reviewVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const { data: request, error: fetchError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    await supabase
      .from('verification_requests')
      .update({
        status,
        admin_notes: adminNotes || '',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (status === 'approved') {
      await supabase
        .from('profiles')
        .update({ verified: true, verified_at: new Date().toISOString(), verification_status: 'approved' })
        .eq('id', request.user_id);
    } else {
      await supabase
        .from('profiles')
        .update({ verification_status: 'rejected', verification_notes: adminNotes || '' })
        .eq('id', request.user_id);
    }

    res.json({ success: true, message: `Request ${status}` });
  } catch (error) {
    console.error('AdminReviewVerification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('*, user:profiles!subscriptions_user_id_fkey(id, name, email)')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, subscriptions: subs || [] });
  } catch (error) {
    console.error('AdminGetSubscriptions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getStats, getUsers, getTasks, getReports,
  blockUser, unblockUser, resolveReport,
  assignSubscription, getPendingVerifications, reviewVerification,
  getSubscriptions
};
