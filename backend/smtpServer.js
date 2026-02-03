const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const db = require('./database');
const EventEmitter = require('events');

class SmtpService extends EventEmitter {
  constructor() {
    super();
    this.server = null;
  }

  start() {
    const port = parseInt(process.env.SMTP_PORT) || 25;
    const host = process.env.SMTP_HOST || '0.0.0.0';

    this.server = new SMTPServer({
      // Allow connections without authentication
      authOptional: true,
      
      // Disable STARTTLS requirement for simplicity (can enable later)
      secure: false,
      disabledCommands: ['STARTTLS'],
      
      // Size limit 10MB
      size: 10 * 1024 * 1024,
      
      // Log connections
      onConnect: (session, callback) => {
        console.log(`📨 SMTP connection from ${session.remoteAddress}`);
        callback();
      },
      
      // Accept all recipients (we filter by domain later)
      onRcptTo: (address, session, callback) => {
        const email = address.address.toLowerCase();
        const domain = email.split('@')[1];
        
        // Check if domain is managed by us
        const managedDomain = db.prepare(
          'SELECT id FROM domains WHERE domain = ? AND is_active = 1'
        ).get(domain);
        
        if (!managedDomain) {
          console.log(`⚠️ Rejected: Domain ${domain} not managed`);
          return callback(new Error(`Domain ${domain} not accepted`));
        }
        
        console.log(`✅ Accepted recipient: ${email}`);
        callback();
      },
      
      // Process incoming email
      onData: (stream, session, callback) => {
        this.processEmail(stream, session)
          .then(() => callback())
          .catch(err => {
            console.error('❌ Error processing email:', err.message);
            callback(err);
          });
      },
      
      onClose: (session) => {
        console.log(`📪 SMTP connection closed from ${session.remoteAddress}`);
      }
    });

    this.server.listen(port, host, () => {
      console.log(`📬 SMTP Server listening on ${host}:${port}`);
    });

    this.server.on('error', (err) => {
      console.error('❌ SMTP Server error:', err.message);
    });
  }

  async processEmail(stream, session) {
    try {
      // Parse email
      const parsed = await simpleParser(stream);
      
      // Get recipient(s)
      let toAddress = '';
      if (parsed.to && parsed.to.value && parsed.to.value.length > 0) {
        toAddress = parsed.to.value[0].address.toLowerCase();
      } else if (session.envelope && session.envelope.rcptTo && session.envelope.rcptTo.length > 0) {
        toAddress = session.envelope.rcptTo[0].address.toLowerCase();
      }
      
      if (!toAddress) {
        console.log('⚠️ No recipient address found, skipping');
        return;
      }
      
      // Extract username and domain
      const [username, domain] = toAddress.split('@');
      
      // Check if domain is managed
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
        
        console.log(`📧 New email received for ${toAddress} from ${fromAddress}`);
        this.emit('newEmail', { sessionId: inbox.session_id, email: newEmail });
      }
    } catch (error) {
      console.error('❌ Error processing email:', error.message);
      throw error;
    }
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('📪 SMTP Server stopped');
      });
    }
  }
}

module.exports = new SmtpService();
