const express = require('express');
const router = express.Router();
const db = require('../database');

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');
  
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  next();
};

// Verify admin credentials
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username === adminUser && password === adminPass) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get all domains
router.get('/domains', authMiddleware, (req, res) => {
  try {
    const domains = db.prepare(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM inboxes WHERE domain = d.domain AND expires_at > datetime('now')) as active_inboxes
      FROM domains d
      ORDER BY d.created_at DESC
    `).all();
    res.json(domains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new domain
router.post('/domains', authMiddleware, (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    // Validate domain format
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }
    
    db.prepare('INSERT INTO domains (domain) VALUES (?)').run(domain.toLowerCase());
    
    const newDomain = db.prepare('SELECT * FROM domains WHERE domain = ?').get(domain.toLowerCase());
    res.json(newDomain);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Domain already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Toggle domain active status
router.patch('/domains/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    db.prepare('UPDATE domains SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
    
    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(id);
    res.json(domain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete domain
router.delete('/domains/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's the last domain
    const count = db.prepare('SELECT COUNT(*) as count FROM domains').get();
    if (count.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last domain' });
    }
    
    db.prepare('DELETE FROM domains WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const stats = {
      totalDomains: db.prepare('SELECT COUNT(*) as count FROM domains').get().count,
      activeDomains: db.prepare('SELECT COUNT(*) as count FROM domains WHERE is_active = 1').get().count,
      activeInboxes: db.prepare(`SELECT COUNT(*) as count FROM inboxes WHERE expires_at > datetime('now')`).get().count,
      totalEmails: db.prepare('SELECT COUNT(*) as count FROM emails').get().count,
      emailsToday: db.prepare(`
        SELECT COUNT(*) as count FROM emails 
        WHERE received_at > datetime('now', '-1 day')
      `).get().count
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active inboxes
router.get('/inboxes', authMiddleware, (req, res) => {
  try {
    const inboxes = db.prepare(`
      SELECT i.*, 
        (SELECT COUNT(*) FROM emails WHERE inbox_id = i.id) as email_count
      FROM inboxes i
      WHERE i.expires_at > datetime('now')
      ORDER BY i.created_at DESC
    `).all();
    res.json(inboxes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inbox manually
router.delete('/inboxes/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM inboxes WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
