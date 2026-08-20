const supabase = require('../config/supabase');

const sendMessage = async (req, res) => {
  try {
    const { taskId, receiverId, content } = req.body;

    if (!taskId || !receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Task ID, receiver ID, and content are required' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isPoster = task.poster_id === req.user.id;
    const isAssigned = task.assigned_to && task.assigned_to === req.user.id;

    if (!isPoster && !isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized to message on this task' });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        task_id: taskId,
        sender_id: req.user.id,
        receiver_id: receiverId,
        content
      })
      .select('*, sender:profiles!messages_sender_id_fkey(id, name, avatar), receiver:profiles!messages_receiver_id_fkey(id, name, avatar)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('newMessage', {
        message,
        task: { id: task.id, title: task.title }
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('*, receiver:profiles!messages_receiver_id_fkey(id, name, avatar), task:tasks(id, title, category)')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    const { data: receivedMessages, error: receivedError } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, name, avatar), task:tasks(id, title, category)')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (sentError || receivedError) {
      return res.status(400).json({ success: false, message: 'Error fetching conversations' });
    }

    const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
    allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const conversationMap = new Map();

    allMessages.forEach(msg => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const key = `${msg.task_id}_${otherUserId}`;

      if (!conversationMap.has(key)) {
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
        conversationMap.set(key, {
          _id: otherUserId,
          taskId: msg.task_id,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
          otherUser: otherUser,
          task: msg.task
        });
      }

      if (msg.receiver_id === userId && !msg.read) {
        const conv = conversationMap.get(key);
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    });

    const conversations = Array.from(conversationMap.values());
    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('GetConversations error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching conversations' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, name, avatar), receiver:profiles!messages_receiver_id_fkey(id, name, avatar)', { count: 'exact' })
      .eq('task_id', taskId)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: false });

    query = query.range(skip, skip + Number(limit) - 1);

    const { data: messages, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('task_id', taskId)
      .eq('sender_id', userId)
      .eq('receiver_id', currentUserId)
      .eq('read', false);

    res.json({
      success: true,
      messages: (messages || []).reverse(),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetMessages error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { taskId, senderId } = req.params;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('task_id', taskId)
      .eq('sender_id', senderId)
      .eq('receiver_id', req.user.id)
      .eq('read', false);

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('MarkAsRead error:', error);
    res.status(500).json({ success: false, message: 'Server error marking messages as read' });
  }
};

module.exports = { sendMessage, getConversations, getMessages, markAsRead };
