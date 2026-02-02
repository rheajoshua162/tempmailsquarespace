require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const inboxRoutes = require('./routes/inbox');
const adminRoutes = require('./routes/admin');
const { initSocket } = require('./socket');
const imapService = require('./imapService');
const { startCleanupJob } = require('./cleanup');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/inbox', inboxRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    imapConnected: imapService.isConnected,
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Initialize Socket.io
initSocket(server);

// Start cleanup cron job
startCleanupJob();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Connect to IMAP
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    imapService.connect();
  } else {
    console.log('⚠️ GMAIL_USER and GMAIL_PASS not set - IMAP disabled');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down...');
  await imapService.disconnect();
  server.close(() => {
    process.exit(0);
  });
});
