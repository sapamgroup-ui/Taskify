const supabase = require('../config/supabase');
const { transformTasks } = require('../utils/transform');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: postedTasks } = await supabase
      .from('tasks')
      .select('*, assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)')
      .eq('poster_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: offeredTasksRaw } = await supabase
      .from('offers')
      .select('task_id')
      .eq('tasker_id', userId);

    const offeredTaskIds = [...new Set((offeredTasksRaw || []).map(o => o.task_id))];

    let offeredTasks = [];
    if (offeredTaskIds.length > 0) {
      const { data } = await supabase
        .from('tasks')
        .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating), assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)')
        .in('id', offeredTaskIds)
        .neq('poster_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      offeredTasks = data || [];
    }

    const { data: activeTasksAsPoster } = await supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating), assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)')
      .eq('poster_id', userId)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: false });

    const { data: activeTasksAsAssigned } = await supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating), assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)')
      .eq('assigned_to', userId)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: false });

    const activeTasksMap = new Map();
    [...(activeTasksAsPoster || []), ...(activeTasksAsAssigned || [])].forEach(t => activeTasksMap.set(t.id, t));
    const activeTasks = Array.from(activeTasksMap.values());

    const { data: completedAsPoster } = await supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating), assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)')
      .eq('poster_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: completedAsAssigned } = await supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name, avatar, rating), assignedTo:profiles!tasks_assigned_to_fkey(id, name, avatar, rating)')
      .eq('assigned_to', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50);

    const completedTasksMap = new Map();
    [...(completedAsPoster || []), ...(completedAsAssigned || [])].forEach(t => completedTasksMap.set(t.id, t));
    const completedTasks = Array.from(completedTasksMap.values());

    const { data: reviewsRaw } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar), reviewee:profiles!reviews_reviewee_id_fkey(id, name, avatar), task:tasks(id, title)')
      .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: earnedPayments } = await supabase
      .from('payments')
      .select('net_amount')
      .eq('payee_id', userId)
      .eq('status', 'captured');

    const { data: spentPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('payer_id', userId)
      .eq('status', 'captured');

    const earnings = (earnedPayments || []).reduce((sum, p) => sum + Number(p.net_amount), 0);
    const spent = (spentPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      user: req.user,
      postedTasks: transformTasks(postedTasks || []),
      offeredTasks: transformTasks(offeredTasks),
      activeTasks: transformTasks(activeTasks),
      completedTasks: transformTasks(completedTasks),
      reviews: reviewsRaw || [],
      earnings,
      spent
    });
  } catch (error) {
    console.error('GetDashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard' });
  }
};

module.exports = { getDashboard };
