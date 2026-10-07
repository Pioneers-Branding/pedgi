const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(PUBLIC_DIR, reqPath);

  // 1. Direct directory -> index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const dirIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(dirIndex)) {
      filePath = dirIndex;
    }
  }

  // 2. Clean URL fallback -> filePath.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const htmlCandidate = filePath.replace(/\/+$/, '') + '.html';
    if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
      filePath = htmlCandidate;
    }
  }

  // 3. /services fallback if no index.html exists
  if (reqPath === '/services' || reqPath === '/services/') {
    const fallbackService = path.join(PUBLIC_DIR, 'services', 'abdominal-pain.html');
    if ((!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) && fs.existsSync(fallbackService)) {
      filePath = fallbackService;
    }
  }

  // 4. File still not found -> 404
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> 404 Not Found`);
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>404 Not Found</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px">
  <h1>404 Not Found</h1>
  <p>The requested path <code>${escapeHtml(reqPath)}</code> was not found on this server.</p>
  <p><a href="/">Return to Home</a></p>
</body>
</html>`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> 200 OK (${path.relative(PUBLIC_DIR, filePath)})`);
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
