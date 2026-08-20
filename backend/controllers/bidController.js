const supabase = require('../config/supabase');

const makeOffer = async (req, res) => {
  try {
    const { amount, message, estimatedTime } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid offer amount is required' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Task is not accepting offers' });
    }

    if (task.poster_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot make an offer on your own task' });
    }

    const { data: existingOffer } = await supabase
      .from('offers')
      .select('id')
      .eq('task_id', task.id)
      .eq('tasker_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (existingOffer) {
      return res.status(400).json({ success: false, message: 'You already have a pending offer on this task' });
    }

    const { data: newOffer, error } = await supabase
      .from('offers')
      .insert({
        task_id: task.id,
        tasker_id: req.user.id,
        amount,
        message: message || '',
        estimated_time: estimatedTime || '',
        status: 'pending'
      })
      .select('*, tasker:profiles!offers_tasker_id_fkey(id, name, avatar, rating, skills)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const { data: allOffers } = await supabase
      .from('offers')
      .select('*, tasker:profiles!offers_tasker_id_fkey(id, name, avatar, rating, skills)')
      .eq('task_id', task.id);

    res.status(201).json({
      success: true,
      task: {
        ...task,
        offers: allOffers || []
      }
    });
  } catch (error) {
    console.error('MakeOffer error:', error);
    res.status(500).json({ success: false, message: 'Server error making offer' });
  }
};

const getOffersForTask = async (req, res) => {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, poster:profiles!tasks_poster_id_fkey(id, name)')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.poster_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view offers' });
    }

    const { data: offers, error } = await supabase
      .from('offers')
      .select('*, tasker:profiles!offers_tasker_id_fkey(id, name, avatar, rating, skills, completed_tasks, location)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, offers: offers || [] });
  } catch (error) {
    console.error('GetOffersForTask error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching offers' });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.poster_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only task poster can accept offers' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Task is no longer open' });
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

    updatedTask.poster = poster;
    updatedTask.assignedTo = assignedUser;

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('AcceptOffer error:', error);
    res.status(500).json({ success: false, message: 'Server error accepting offer' });
  }
};

const rejectOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.poster_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only task poster can reject offers' });
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

    const { error: updateError } = await supabase
      .from('offers')
      .update({ status: 'rejected' })
      .eq('id', offerId);

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const { data: allOffers } = await supabase
      .from('offers')
      .select('*, tasker:profiles!offers_tasker_id_fkey(id, name, avatar, rating)')
      .eq('task_id', task.id);

    res.json({ success: true, message: 'Offer rejected', task: { ...task, offers: allOffers || [] } });
  } catch (error) {
    console.error('RejectOffer error:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting offer' });
  }
};

const withdrawOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
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

    if (offer.tasker_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to withdraw this offer' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only withdraw pending offers' });
    }

    const { error: deleteError } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (deleteError) {
      return res.status(400).json({ success: false, message: deleteError.message });
    }

    res.json({ success: true, message: 'Offer withdrawn successfully' });
  } catch (error) {
    console.error('WithdrawOffer error:', error);
    res.status(500).json({ success: false, message: 'Server error withdrawing offer' });
  }
};

module.exports = { makeOffer, getOffersForTask, acceptOffer, rejectOffer, withdrawOffer };
