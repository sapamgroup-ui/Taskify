require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://taskify-uum5.vercel.app', 'https://taskify-uum5.vercel.app'],
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

app.use(cors({
  origin: function(origin, callback) {
    const allowed = ['http://localhost:5173', 'http://localhost:3000', 'https://taskify-uum5.vercel.app'];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('io', io);

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('join_task', (taskId) => {
    socket.join(`task_${taskId}`);
  });

  socket.on('leave_task', (taskId) => {
    socket.leave(`task_${taskId}`);
  });

  socket.on('send_message', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', data);
    }
    io.to(`task_${data.taskId}`).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    io.to(`task_${data.taskId}`).emit('user_typing', data);
  });

  socket.on('stop_typing', (data) => {
    io.to(`task_${data.taskId}`).emit('user_stop_typing', data);
  });

  socket.on('task_updated', (data) => {
    io.to(`task_${data.taskId}`).emit('task_update', data);
  });

  socket.on('offer_received', (data) => {
    const receiverSocketId = onlineUsers.get(data.posterId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_offer', data);
    }
  });

  socket.on('offer_accepted', (data) => {
    const taskerSocketId = onlineUsers.get(data.taskerId);
    if (taskerSocketId) {
      io.to(taskerSocketId).emit('offer_accepted_notification', data);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('online_users', Array.from(onlineUsers.keys()));
    console.log('User disconnected:', socket.id);
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api', require('./routes/comments'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/admin', require('./routes/admin'));

const { upload } = require('./middleware/upload');
const { auth } = require('./middleware/auth');

app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: filePath });
});

const { getDashboard } = require('./controllers/dashboardController');
app.get('/api/dashboard', auth, getDashboard);

app.get('/api/seed-admin', async (req, res) => {
  try {
    const supabase2 = require('./config/supabase');
    const bcrypt2 = require('bcryptjs');

    const email = 'admin@alltasker.com';
    const password = 'admin123';

    const { data: existing } = await supabase2
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, message: 'Admin already exists', userId: existing.id });
    }

    const { data: authData, error: authError } = await supabase2.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ success: false, message: 'Auth error: ' + authError.message, code: authError.code });
    }

    const hashedPassword = await bcrypt2.hash(password, 10);

    const { error: profileError } = await supabase2
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: 'Admin',
        email,
        phone: '9999999999',
        role: 'admin',
        location: {},
        skills: [],
        avatar: '',
        bio: 'Platform Administrator',
        verified: true,
        verified_at: new Date().toISOString(),
        verification_status: 'approved',
        rating: 0,
        total_reviews: 0,
        completed_tasks: 0,
        earning: 0,
        spent: 0,
        upi_id: '',
        bank_details: {},
        is_business: false,
        business_name: '',
        business_type: '',
        blocked: false
      });

    if (profileError) {
      return res.status(400).json({ success: false, message: 'Profile error: ' + profileError.message });
    }

    res.json({ success: true, message: 'Admin created successfully', userId: authData.user.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Taskify API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size too large. Maximum 10MB allowed.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Too many files. Maximum 10 allowed.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `Duplicate value for ${field}` });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Taskify server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, server, io };
