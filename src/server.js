const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { analyzeText } = require('./analysisEngine');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/health', (_, res) => res.json({ ok: true }));

// Analyze text (paste / explicit call)
app.post('/api/analyze', (req, res) => {
  try {
    const { text, keyword } = req.body || {};
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }
    if (text.length > 500000) {
      return res.status(413).json({ error: 'Text too long.' });
    }
    const metrics = analyzeText(text, keyword || '');
    res.json({ metrics });
  } catch (err) {
    console.error('Error /api/analyze:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// URL analyze stub (ready for later)
app.post('/api/url-analyze', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required.' });
    }
    // Implementation later: fetch HTML safely, run analyzeText.
    return res.status(501).json({ error: 'Not implemented yet.' });
  } catch (err) {
    console.error('Error /api/url-analyze:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// WebSocket for live typing
const wss = new WebSocketServer({ server, path: '/ws/analyze' });

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const { text, keyword } = JSON.parse(msg.toString());
      if (typeof text !== 'string' || text.length === 0 || text.length > 500000) return;
      const metrics = analyzeText(text, keyword || '');
      ws.send(JSON.stringify({ type: 'metrics', metrics }));
    } catch (_) {
      // ignore malformed
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
