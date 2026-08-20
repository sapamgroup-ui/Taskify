const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { auth, adminAuth } = require('../middleware/auth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const TICKER_FILE = path.join(DATA_DIR, 'ticker.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON(filePath, fallback) {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// POST /api/analytics/track - Track an event
router.post('/track', (req, res) => {
  try {
    const { event, category, taskId, userId, metadata } = req.body;

    if (!event) {
      return res.status(400).json({ success: false, message: 'Event name is required' });
    }

    const analytics = readJSON(ANALYTICS_FILE, { events: [] });

    analytics.events.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      event,
      category: category || null,
      taskId: taskId || null,
      userId: userId || null,
      metadata: metadata || null,
      timestamp: new Date().toISOString()
    });

    writeJSON(ANALYTICS_FILE, analytics);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/analytics/dashboard - Get analytics summary (admin only)
router.get('/dashboard', adminAuth, (req, res) => {
  try {
    const analytics = readJSON(ANALYTICS_FILE, { events: [] });
    const events = analytics.events;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7Days = events.filter(e => new Date(e.timestamp) >= sevenDaysAgo);

    const eventsByCategory = {};
    const eventsByDate = {};
    const categoryCount = {};

    events.forEach(e => {
      const cat = e.category || 'uncategorized';
      eventsByCategory[cat] = (eventsByCategory[cat] || 0) + 1;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;

      const dateKey = e.timestamp.slice(0, 10);
      eventsByDate[dateKey] = (eventsByDate[dateKey] || 0) + 1;
    });

    const popularCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const recentEvents = events
      .slice(-50)
      .reverse();

    res.json({
      success: true,
      data: {
        totalEvents: events.length,
        eventsByCategory,
        eventsByDate,
        popularCategories,
        recentEvents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/analytics/category/:category - Get analytics for a specific category
router.get('/category/:category', auth, (req, res) => {
  try {
    const { category } = req.params;
    const analytics = readJSON(ANALYTICS_FILE, { events: [] });

    const filtered = analytics.events.filter(e => e.category === category);

    const eventsByDate = {};
    filtered.forEach(e => {
      const dateKey = e.timestamp.slice(0, 10);
      eventsByDate[dateKey] = (eventsByDate[dateKey] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        category,
        totalEvents: filtered.length,
        eventsByDate,
        events: filtered.slice(-50).reverse()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/analytics/ticker - Get ticker config (public)
router.get('/ticker', (req, res) => {
  try {
    const config = readJSON(TICKER_FILE, {
      items: [],
      bgColor: '#1a1a2e',
      textColor: '#e94560',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      speed: 'normal'
    });

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/analytics/ticker - Update ticker config (admin only)
router.put('/ticker', adminAuth, (req, res) => {
  try {
    const { items, bgColor, textColor, fontSize, fontFamily, speed } = req.body;

    const config = {
      items: Array.isArray(items) ? items : [],
      bgColor: bgColor || '#1a1a2e',
      textColor: textColor || '#e94560',
      fontSize: fontSize || '14px',
      fontFamily: fontFamily || 'Arial, sans-serif',
      speed: speed || 'normal'
    };

    writeJSON(TICKER_FILE, config);

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
