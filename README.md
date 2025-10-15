# Shortlinks - URL Shortener

A simple and elegant URL shortener service built with Node.js, Express, and SQLite.

## Features

- 🚀 **Fast URL Shortening** - Generate short links instantly
- 🎯 **Custom Short Codes** - Create memorable, branded links
- 📊 **Click Tracking** - Monitor link performance and statistics
- 💾 **SQLite Database** - Lightweight, file-based storage
- 🎨 **Modern UI** - Clean, responsive design
- ⚡ **No Authentication Required** - Simple and easy to use

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Creating a Shortlink

1. Enter your long URL in the input field
2. (Optional) Add a custom short code
3. Click "Shorten URL"
4. Copy and share your new short link!

### API Endpoints

#### POST /api/shorten
Create a new shortlink

**Request Body:**
```json
{
  "url": "https://example.com/very/long/url",
  "customCode": "my-link" // optional
}
```

**Response:**
```json
{
  "success": true,
  "shortUrl": "http://localhost:3000/abc123",
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very/long/url"
}
```

#### GET /api/stats/:shortCode
Get statistics for a shortlink

**Response:**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "clicks": 42,
  "createdAt": "2025-10-15 12:00:00"
}
```

#### GET /api/links
Get all recent links (last 100)

#### GET /:shortCode
Redirect to the original URL (increments click counter)

## Technology Stack

- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Frontend:** Vanilla JavaScript, CSS3, HTML5
- **ID Generation:** nanoid
- **URL Validation:** valid-url

## Project Structure

```
Shortlinks/
├── server.js           # Express server and API routes
├── package.json        # Dependencies and scripts
├── shortlinks.db       # SQLite database (auto-generated)
├── public/
│   ├── index.html      # Main page
│   ├── stats.html      # Statistics page
│   ├── 404.html        # Error page
│   ├── style.css       # Styles
│   └── script.js       # Frontend JavaScript
└── README.md           # This file
```

## Configuration

You can change the port by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Database Schema

```sql
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0
)
```

## Security Considerations

- URL validation ensures only valid URLs are shortened
- Custom codes are sanitized (alphanumeric, dashes, underscores only)
- SQLite prepared statements prevent SQL injection
- No user authentication means links are public

## Future Enhancements

- User authentication and link management
- Expiring links (TTL)
- Link editing and deletion
- QR code generation
- Analytics dashboard
- Custom domains
- Rate limiting
- Link categories/tags

## License

ISC

## Author

Created with ❤️ for simple and effective URL shortening.
