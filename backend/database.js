const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tempmail.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inboxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    domain TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inbox_id INTEGER NOT NULL,
    message_id TEXT UNIQUE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    subject TEXT,
    text_body TEXT,
    html_body TEXT,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY (inbox_id) REFERENCES inboxes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT,
    size INTEGER,
    content BLOB,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_inboxes_session ON inboxes(session_id);
  CREATE INDEX IF NOT EXISTS idx_inboxes_username_domain ON inboxes(username, domain);
  CREATE INDEX IF NOT EXISTS idx_emails_inbox ON emails(inbox_id);
  CREATE INDEX IF NOT EXISTS idx_inboxes_expires ON inboxes(expires_at);
`);

// Insert default domain if none exists
const domainCount = db.prepare('SELECT COUNT(*) as count FROM domains').get();
if (domainCount.count === 0) {
  db.prepare('INSERT INTO domains (domain) VALUES (?)').run('tempmail.dev');
}

module.exports = db;
