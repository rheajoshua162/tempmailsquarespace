const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id}`);

    // Subscribe to inbox updates (using Socket.io rooms)
    socket.on('subscribe', (sessionId) => {
      socket.join(sessionId);
      socket.sessionId = sessionId;
      console.log(`📬 Socket ${socket.id} subscribed to session ${sessionId}`);
    });

    // Unsubscribe from inbox updates
    socket.on('unsubscribe', (sessionId) => {
      socket.leave(sessionId);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Listen for new emails from IMAP service (if using IMAP mode)
  const EMAIL_MODE = process.env.EMAIL_MODE || 'imap';
  if (EMAIL_MODE === 'imap') {
    const imapService = require('./imapService');
    imapService.on('newEmail', ({ sessionId, email }) => {
      io.to(sessionId).emit('newEmail', email);
      console.log(`📤 Emitted newEmail to session ${sessionId}`);
    });
  }

  return io;
}

function getSocketIO() {
  return io;
}

function getIO() {
  return io;
}

function emitToSession(sessionId, event, data) {
  if (io) {
    io.to(sessionId).emit(event, data);
  }
}

module.exports = { initSocket, getIO, getSocketIO, emitToSession };
