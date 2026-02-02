const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const db = require('./database');
const EventEmitter = require('events');

class ImapService extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.isConnected = false;
    this.pollingInterval = null;
    this.processedUids = new Set();
  }

  getConfig() {
    return {
      imap: {
        user: process.env.GMAIL_USER,
        password: process.env.GMAIL_PASS,
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };
  }

  async connect() {
    try {
      console.log('🔌 Connecting to IMAP server...');
      this.connection = await imaps.connect(this.getConfig());
      this.isConnected = true;
      console.log('✅ Connected to IMAP server');
      
      await this.connection.openBox('INBOX');
      console.log('📬 Opened INBOX');
      
      // Start polling
      this.startPolling();
      
      return true;
    } catch (error) {
      console.error('❌ IMAP connection error:', error.message);
      this.isConnected = false;
      
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
      return false;
    }
  }

  startPolling() {
    const interval = parseInt(process.env.POLLING_INTERVAL_MS) || 2000;
    
    console.log(`🔄 Starting email polling every ${interval}ms`);
    
    this.pollingInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.fetchNewEmails();
      }
    }, interval);
    
    // Initial fetch
    this.fetchNewEmails();
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async fetchNewEmails() {
    try {
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: [''],
        markSeen: true,
        struct: true
      };

      const messages = await this.connection.search(searchCriteria, fetchOptions);
      
      for (const message of messages) {
        const uid = message.attributes.uid;
        
        // Skip already processed
        if (this.processedUids.has(uid)) continue;
        this.processedUids.add(uid);
        
        // Keep set size manageable
        if (this.processedUids.size > 1000) {
          const arr = Array.from(this.processedUids);
          this.processedUids = new Set(arr.slice(-500));
        }
        
        const all = message.parts.find(part => part.which === '');
        if (all && all.body) {
          await this.processEmail(all.body, message.attributes);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching emails:', error.message);
      
      if (error.message.includes('Not connected') || error.message.includes('connection')) {
        this.isConnected = false;
        this.stopPolling();
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  async processEmail(rawEmail, attributes) {
    try {
      const parsed = await simpleParser(rawEmail);
      
      // Extract recipient email address
      let toAddress = '';
      if (parsed.to && parsed.to.value && parsed.to.value.length > 0) {
        toAddress = parsed.to.value[0].address.toLowerCase();
      } else if (parsed.headers.get('delivered-to')) {
        toAddress = parsed.headers.get('delivered-to').toLowerCase();
      }
      
      if (!toAddress) {
        console.log('⚠️ No recipient address found, skipping');
        return;
      }
      
      // Extract username and domain from to address
      const [username, domain] = toAddress.split('@');
      
      // Check if domain is managed by us
      const managedDomain = db.prepare(
        'SELECT id FROM domains WHERE domain = ? AND is_active = 1'
      ).get(domain);
      
      if (!managedDomain) {
        console.log(`⚠️ Domain ${domain} not managed, skipping`);
        return;
      }
      
      // Find matching inbox
      const inbox = db.prepare(`
        SELECT id, session_id FROM inboxes 
        WHERE username = ? AND domain = ? AND expires_at > datetime('now')
      `).get(username, domain);
      
      if (!inbox) {
        console.log(`⚠️ No active inbox for ${username}@${domain}, skipping`);
        return;
      }
      
      // Get from address
      let fromAddress = '';
      if (parsed.from && parsed.from.value && parsed.from.value.length > 0) {
        fromAddress = parsed.from.value[0].address;
      }
      
      // Insert email
      const result = db.prepare(`
        INSERT OR IGNORE INTO emails (inbox_id, message_id, from_address, to_address, subject, text_body, html_body)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        inbox.id,
        parsed.messageId || `${Date.now()}-${Math.random()}`,
        fromAddress,
        toAddress,
        parsed.subject || '(No Subject)',
        parsed.text || '',
        parsed.html || ''
      );
      
      if (result.changes > 0) {
        const emailId = result.lastInsertRowid;
        
        // Save attachments
        if (parsed.attachments && parsed.attachments.length > 0) {
          const attachmentStmt = db.prepare(`
            INSERT INTO attachments (email_id, filename, content_type, size, content)
            VALUES (?, ?, ?, ?, ?)
          `);
          
          for (const attachment of parsed.attachments) {
            attachmentStmt.run(
              emailId,
              attachment.filename || 'unnamed',
              attachment.contentType || 'application/octet-stream',
              attachment.size || 0,
              attachment.content
            );
          }
        }
        
        // Emit event for realtime update
        const newEmail = db.prepare(`
          SELECT e.*, 
            (SELECT COUNT(*) FROM attachments WHERE email_id = e.id) as attachment_count
          FROM emails e WHERE e.id = ?
        `).get(emailId);
        
        console.log(`📧 New email received for ${toAddress}`);
        this.emit('newEmail', { sessionId: inbox.session_id, email: newEmail });
      }
    } catch (error) {
      console.error('❌ Error processing email:', error.message);
    }
  }

  async disconnect() {
    this.stopPolling();
    if (this.connection) {
      try {
        await this.connection.end();
      } catch (e) {}
    }
    this.isConnected = false;
  }
}

module.exports = new ImapService();
