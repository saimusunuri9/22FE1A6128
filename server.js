const express = require('express');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const urlMap = {};
// Serve HTML form with frontend validation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>URL Shortener</title></head>
      <body>
        <h1>URL Shortener Microservice</h1>
        <form id="shortenForm">
          <input type="url" id="urlInput" placeholder="Enter URL here" required style="width: 300px;" />
          <button type="submit">Shorten</button>
        </form>
        <p id="result" style="color: red;"></p>

        <script>
          const form = document.getElementById('shortenForm');
          const result = document.getElementById('result');

          function isValidUrl(string) {
            try {
              new URL(string);
              return true;
            } catch (_) {
              return false;  
            }
          }

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('urlInput').value;

            if (!isValidUrl(url)) {
              result.style.color = 'red';
              result.textContent = 'Invalid URL! Please enter a valid URL.';
              return;
            }

            try {
              const response = await fetch('/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
              });
              const data = await response.json();

              if (response.ok) {
                result.style.color = 'green';
                result.textContent = 'Short URL: ' + data.shortUrl;
              } else {
                result.style.color = 'red';
                result.textContent = 'Error: ' + (data.error || 'Unknown error');
              }
            } catch (err) {
              result.style.color = 'red';
              result.textContent = 'Error: ' + err.message;
            }
          });
        </script>
      </body>
    </html>
  `);
});

// POST /shorten endpoint with backend URL validation
app.post('/shorten', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format on backend
  try {
    new URL(url);
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Generate short ID and store the mapping
  const id = nanoid(6);
  urlMap[id] = url;

  // Return the shortened URL (you may want to update host if deploying)
  const host = req.headers.host; // e.g. localhost:3000 or Codespaces URL
  res.json({ shortUrl: `http://${host}/${id}` });
});

// Redirect short URL to original URL
app.get('/:id', (req, res) => {
  const originalUrl = urlMap[req.params.id];

  if (originalUrl) {
    return res.redirect(originalUrl);
  }

  return res.status(404).json({ error: 'Short URL not found' });
});

app.listen(PORT, () => {
  console.log(`URL Shortener microservice running at http://localhost:${PORT}`);
});
