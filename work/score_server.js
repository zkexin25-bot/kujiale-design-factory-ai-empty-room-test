const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 32123;
const rootDir = path.resolve('C:/Users/Administrator/Documents/Codex/2026-08-11/jie');
const outputsDir = path.join(rootDir, 'outputs');
const dataDir = path.join(outputsDir, 'data');
const dataFile = path.join(dataDir, 'room_compare_scores.json');
const comparePage = path.join(outputsDir, '空房间测试对照页.html');
const statsPage = path.join(outputsDir, '空房间测试统计页.html');

function ensureStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

function sendJson(res, code, payload) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, code, text, contentType) {
  res.writeHead(code, {
    'Content-Type': `${contentType}; charset=utf-8`,
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

function sendFile(res, filePath, contentType) {
  try {
    const buffer = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    res.end(buffer);
  } catch (error) {
    sendJson(res, 404, { ok: false, error: 'file not found', path: filePath });
  }
}

function safeInside(baseDir, targetPath) {
  const relative = path.relative(baseDir, targetPath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html';
  if (ext === '.js') return 'application/javascript';
  if (ext === '.css') return 'text/css';
  if (ext === '.json') return 'application/json';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (url.pathname === '/scores' && req.method === 'GET') {
    try {
      return sendJson(res, 200, { ok: true, scores: readStore(), path: dataFile });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: String(error) });
    }
  }

  if (url.pathname === '/scores' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload || typeof payload !== 'object' || typeof payload.key !== 'string') {
          return sendJson(res, 400, { ok: false, error: 'invalid payload' });
        }
        const store = readStore();
        store[payload.key] = {
          grade: payload.grade || '',
          note: payload.note || ''
        };
        writeStore(store);
        return sendJson(res, 200, { ok: true, saved: store[payload.key], path: dataFile });
      } catch (error) {
        return sendJson(res, 500, { ok: false, error: String(error) });
      }
    });
    return;
  }

  if (url.pathname === '/scores/bulk' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload || typeof payload !== 'object' || typeof payload.scores !== 'object') {
          return sendJson(res, 400, { ok: false, error: 'invalid payload' });
        }
        writeStore(payload.scores);
        return sendJson(res, 200, { ok: true, count: Object.keys(payload.scores).length, path: dataFile });
      } catch (error) {
        return sendJson(res, 500, { ok: false, error: String(error) });
      }
    });
    return;
  }

  if (url.pathname === '/image' && req.method === 'GET') {
    const rawPath = url.searchParams.get('path');
    if (!rawPath) {
      return sendJson(res, 400, { ok: false, error: 'missing path' });
    }

    const resolvedPath = path.resolve(rawPath);
    const desktopDir = path.resolve('C:/Users/Administrator/Desktop');
    if (!safeInside(desktopDir, resolvedPath)) {
      return sendJson(res, 403, { ok: false, error: 'path outside allowed directory' });
    }
    return sendFile(res, resolvedPath, getContentType(resolvedPath));
  }

  if ((url.pathname === '/' || url.pathname === '/index.html') && req.method === 'GET') {
    return sendFile(res, comparePage, 'text/html; charset=utf-8');
  }

  if (url.pathname === '/空房间测试对照页.html' && req.method === 'GET') {
    return sendFile(res, comparePage, 'text/html; charset=utf-8');
  }

  if (url.pathname === '/空房间测试统计页.html' && req.method === 'GET') {
    return sendFile(res, statsPage, 'text/html; charset=utf-8');
  }

  const staticPath = path.join(outputsDir, decodeURIComponent(url.pathname.replace(/^\//, '')));
  if (req.method === 'GET' && safeInside(outputsDir, staticPath) && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    return sendFile(res, staticPath, getContentType(staticPath));
  }

  return sendJson(res, 404, { ok: false, error: 'not found' });
});

ensureStore();
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Score server listening on http://127.0.0.1:${PORT}`);
  console.log(`Store: ${dataFile}`);
});
