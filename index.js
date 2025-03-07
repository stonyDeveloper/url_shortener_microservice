require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Body parser middleware to handle POST requests
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// URL database (in-memory storage)
// In a production app, you would use a real database
const urlDatabase = {};
let urlCount = 1;

// Function to validate URL format
function isValidUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

// POST endpoint to create short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // Check if URL is valid
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }
  
  // Extract hostname for DNS lookup
  const hostname = new URL(originalUrl).hostname;
  
  // Verify domain exists with DNS lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    
    // Check if URL already exists in database
    for (const [key, value] of Object.entries(urlDatabase)) {
      if (value === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: parseInt(key)
        });
      }
    }
    
    // Add new URL to database
    urlDatabase[urlCount] = originalUrl;
    
    // Return response
    res.json({
      original_url: originalUrl,
      short_url: urlCount
    });
    
    // Increment counter for next short URL
    urlCount++;
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  
  // Check if short URL exists in database
  if (urlDatabase[shortUrl]) {
    res.redirect(urlDatabase[shortUrl]);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});