const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const { analyzeText } = require("./analysisEngine");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/analyze", (req, res) => {
  try {
    const { text = "", keyword = "" } = req.body || {};
    const metrics = analyzeText(text, keyword);
    res.json(metrics);
  } catch (err) {
    console.error("REST analyze error:", err);
    res.status(500).json({ ok: false, error: "ANALYZE_FAILED" });
  }
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws/analyze" });

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    try {
      const { text = "", keyword = "" } = JSON.parse(raw.toString());
      const metrics = analyzeText(text, keyword);
      ws.send(JSON.stringify({ type: "metrics", ...metrics }));
    } catch (err) {
      console.error("WS analyze error:", err);
      ws.send(
        JSON.stringify({
          type: "error",
          ok: false,
          error: "INVALID_PAYLOAD",
        })
      );
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
