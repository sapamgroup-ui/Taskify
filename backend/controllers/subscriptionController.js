const supabase = require('../config/supabase');

const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', monthStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (!subscription) {
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          replies_used: 0,
          replies_limit: 1,
          posts_used: 0,
          posts_limit: 2,
          start_date: now.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        return res.status(400).json({ success: false, message: createError.message });
      }

      return res.json({ success: true, subscription: newSub });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('GetSubscription error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching subscription' });
  }
};

const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!plan || !['per_reply', 'basic', 'premium'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan. Choose per_reply, basic, or premium' });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', monthStart)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const planConfig = {
      per_reply: { replies_limit: 1, posts_limit: 0 },
      basic: { replies_limit: 7, posts_limit: 7 },
      premium: { replies_limit: -1, posts_limit: -1 }
    };
    const cfg = planConfig[plan];

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan,
          replies_limit: cfg.replies_limit,
          posts_limit: cfg.posts_limit,
          replies_used: 0,
          posts_used: 0,
          start_date: now.toISOString(),
          end_date: plan === 'per_reply' ? null : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
          status: 'active'
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ success: false, message: updateError.message });
      }

      return res.json({ success: true, subscription: updated });
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        replies_used: 0,
        replies_limit: cfg.replies_limit,
        posts_used: 0,
        posts_limit: cfg.posts_limit,
        start_date: now.toISOString(),
        end_date: plan === 'per_reply' ? null : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('CreateSubscription error:', error);
    res.status(500).json({ success: false, message: 'Server error creating subscription' });
  }
};

const checkAndUseReply = async (userId) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', monthStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    const { data: newSub } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'free',
        replies_used: 1,
        replies_limit: 1,
        posts_used: 0,
        posts_limit: 2,
        start_date: now.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    return { allowed: true, subscription: newSub };
  }

  if (subscription.plan === 'premium') {
    return { allowed: true, subscription };
  }

  if (subscription.plan === 'basic' && subscription.replies_used < subscription.replies_limit) {
    const { data: updated } = await supabase
      .from('subscriptions')
      .update({ replies_used: subscription.replies_used + 1 })
      .eq('id', subscription.id)
      .select()
      .single();
    return { allowed: true, subscription: updated };
  }

  if (subscription.replies_used >= subscription.replies_limit) {
    return { allowed: false, subscription };
  }

  const { data: updated } = await supabase
    .from('subscriptions')
    .update({ replies_used: subscription.replies_used + 1 })
    .eq('id', subscription.id)
    .select()
    .single();

  return { allowed: true, subscription: updated };
};

module.exports = { getSubscription, createSubscription, checkAndUseReply };
