const express = require('express');
const path = require('path');
const { nanoid } = require('nanoid');
const validUrl = require('valid-url');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
let db;
const dbPath = 'shortlinks.db';

async function initDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      clicks INTEGER DEFAULT 0
    )
  `);
  
  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes

// Create a new shortlink
app.post('/api/shorten', (req, res) => {
  const { url, customCode } = req.body;

  // Validate URL
  if (!url || !validUrl.isUri(url)) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  // Generate or use custom short code
  let shortCode = customCode;
  
  if (customCode) {
    // Validate custom code (alphanumeric and dashes only)
    if (!/^[a-zA-Z0-9-_]+$/.test(customCode)) {
      return res.status(400).json({ error: 'Custom code can only contain letters, numbers, dashes, and underscores' });
    }
    
    // Check if custom code already exists
    const existing = db.exec('SELECT * FROM links WHERE short_code = ?', [customCode]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Custom code already in use' });
    }
  } else {
    // Generate a unique short code
    shortCode = nanoid(6);
    
    // Ensure uniqueness (extremely rare collision)
    let attempts = 0;
    while (attempts < 5) {
      const existing = db.exec('SELECT * FROM links WHERE short_code = ?', [shortCode]);
      if (existing.length === 0 || existing[0].values.length === 0) break;
      shortCode = nanoid(6);
      attempts++;
    }
  }

  try {
    // Insert into database
    db.run('INSERT INTO links (short_code, original_url) VALUES (?, ?)', [shortCode, url]);
    saveDatabase();

    // Return the shortened URL
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
    res.json({ 
      success: true, 
      shortUrl, 
      shortCode,
      originalUrl: url 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to create shortlink' });
  }
});

// Get link statistics
app.get('/api/stats/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  
  const result = db.exec('SELECT * FROM links WHERE short_code = ?', [shortCode]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Shortlink not found' });
  }

  const row = result[0].values[0];
  res.json({
    shortCode: row[1],
    originalUrl: row[2],
    clicks: row[4],
    createdAt: row[3]
  });
});

// Get all links (for admin purposes)
app.get('/api/links', (req, res) => {
  const result = db.exec('SELECT * FROM links ORDER BY created_at DESC LIMIT 100');
  
  if (result.length === 0) {
    return res.json([]);
  }
  
  const links = result[0].values.map(row => ({
    id: row[0],
    short_code: row[1],
    original_url: row[2],
    created_at: row[3],
    clicks: row[4]
  }));
  
  res.json(links);
});

// Redirect shortlink to original URL
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  
  const result = db.exec('SELECT * FROM links WHERE short_code = ?', [shortCode]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }

  const link = result[0].values[0];
  const originalUrl = link[2];

  // Increment click counter
  db.run('UPDATE links SET clicks = clicks + 1 WHERE short_code = ?', [shortCode]);
  saveDatabase();

  // Redirect to original URL
  res.redirect(originalUrl);
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Shortlinks service running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
