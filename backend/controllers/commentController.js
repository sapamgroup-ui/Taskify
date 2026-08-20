const supabase = require('../config/supabase');
const { checkAndUseReply } = require('./subscriptionController');

const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, profiles(id, name, avatar, role)')
      .eq('task_id', taskId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('comments')
          .select('*, profiles(id, name, avatar, role)')
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true });

        return { ...comment, replies: replies || [] };
      })
    );

    res.json({ success: true, comments: commentsWithReplies });
  } catch (error) {
    console.error('GetComments error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching comments' });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const { allowed, subscription } = await checkAndUseReply(userId);

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Free plan: 1 reply/month. Upgrade for more.' });
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        parent_id: parentId || null,
        content: content.trim(),
        is_public: true
      })
      .select('*, profiles(id, name, avatar, role)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('AddComment error:', error);
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('DeleteComment error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting comment' });
  }
};

module.exports = { getComments, addComment, deleteComment };
