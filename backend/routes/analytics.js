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
      enabled: false,
      items: [],
      bgColor: '#1a1a2e',
      textColor: '#ffffff',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif',
      speed: 'normal',
      direction: 'rtl',
      gap: 30,
      seamlessLoop: true,
      showDividers: true,
      dividerStyle: '|',
      pauseOnHover: false,
      textShadow: false,
      borderColor: '',
      borderWidth: 0,
      borderRadius: 0,
      padding: 'medium',
      label: 'NOW BUZZING',
      labelBg: '#e94560',
      labelColor: '#ffffff'
    });

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/analytics/ticker - Update ticker config (admin only)
router.put('/ticker', adminAuth, (req, res) => {
  try {
    const config = {
      enabled: req.body.enabled !== undefined ? req.body.enabled : false,
      items: Array.isArray(req.body.items) ? req.body.items.map(item => ({
        id: item.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        html: item.html || item.text || '',
        text: item.text || '',
        bgColor: item.bgColor || '',
        textColor: item.textColor || '',
        fontWeight: item.fontWeight || 'normal',
        fontStyle: item.fontStyle || 'normal',
        textDecoration: item.textDecoration || 'none',
        fontSize: item.fontSize || '',
        fontFamily: item.fontFamily || '',
        padding: item.padding || '',
        borderRadius: item.borderRadius || '',
        borderColor: item.borderColor || '',
        borderWidth: item.borderWidth || 0
      })) : [],
      bgColor: req.body.bgColor || '#1a1a2e',
      textColor: req.body.textColor || '#ffffff',
      fontSize: req.body.fontSize || '14px',
      fontFamily: req.body.fontFamily || 'Inter, system-ui, sans-serif',
      speed: req.body.speed || 'normal',
      direction: req.body.direction || 'rtl',
      gap: req.body.gap !== undefined ? req.body.gap : 30,
      seamlessLoop: req.body.seamlessLoop !== undefined ? req.body.seamlessLoop : true,
      showDividers: req.body.showDividers !== undefined ? req.body.showDividers : true,
      dividerStyle: req.body.dividerStyle || '|',
      pauseOnHover: req.body.pauseOnHover !== undefined ? req.body.pauseOnHover : false,
      textShadow: req.body.textShadow !== undefined ? req.body.textShadow : false,
      borderColor: req.body.borderColor || '',
      borderWidth: req.body.borderWidth || 0,
      borderRadius: req.body.borderRadius || 0,
      padding: req.body.padding || 'medium',
      label: req.body.label || 'NOW BUZZING',
      labelBg: req.body.labelBg || '#e94560',
      labelColor: req.body.labelColor || '#ffffff'
    };

    writeJSON(TICKER_FILE, config);

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
