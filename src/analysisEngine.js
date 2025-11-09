
const STOPWORDS = new Set([
    'the','a','an','and','or','of','to','in','is','are','for','on','at','this','that','with','as','by','it','be','from',
    'was','were','will','shall','can','could','should','would','have','has','had','do','does','did','not','but','if',
    'so','we','you','they','i','he','she','them','his','her','our','your','their'
  ]);
  
  function normalizeText(raw) {
    if (!raw) return '';
    return raw.replace(/\r\n?/g, '\n');
  }
  
  function tokenizeWords(text) {
    const matches = text
      .toLowerCase()
      .match(/\p{L}[\p{L}\p{N}'’-]*/gu);
    return matches || [];
  }
  
  function analyzeText(rawText = "", rawKeyword = "") {
    const text = String(rawText);
    const keyword = String(rawKeyword || "").trim().toLowerCase();
  
    const words = text.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const charCount = text.length;
  
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0);
  
    const readingTimeSeconds = wordCount / 3.75; // ~225 wpm
    const speakingTimeSeconds = wordCount / 2.5; // ~150 wpm
  
    let keywordCount = 0;
    let keywordDensity = 0;
    if (keyword) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      keywordCount = (text.match(regex) || []).length;
      keywordDensity = wordCount
        ? Number(((keywordCount / wordCount) * 100).toFixed(2))
        : 0;
    }
  
    // Repeated 3-word phrases (top 5)
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  
    const phrases = {};
    for (let i = 0; i < tokens.length - 2; i++) {
      const phrase = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      if (phrase.length <= 10) continue;
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  
    const repeatedPhrases = Object.entries(phrases)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase, count]) => ({ phrase, count }));
  
    return {
      ok: true,
      wordCount,
      charCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      readingTime: Math.ceil(readingTimeSeconds),
      speakingTime: Math.ceil(speakingTimeSeconds),
      keywordCount,
      keywordDensity,
      repeatedPhrases,
    };
  }
  
  module.exports = { analyzeText };
  
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  function buildTopKeywords(tokens, totalWords) {
    const freq = {};
    for (const t of tokens) {
      if (STOPWORDS.has(t) || t.length <= 2) continue;
      freq[t] = (freq[t] || 0) + 1;
    }
    return Object.entries(freq)
      .map(([word, count]) => ({
        word,
        count,
        density: totalWords ? +((count / totalWords) * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
  
  function buildRepeatedPhrases(tokens) {
    const res = [];
    [2, 3, 4].forEach(n => {
      const map = {};
      for (let i = 0; i <= tokens.length - n; i++) {
        const phrase = tokens.slice(i, i + n).join(' ');
        if (phrase.length < 10) continue;
        map[phrase] = (map[phrase] || 0) + 1;
      }
      Object.entries(map)
        .filter(([, count]) => count > 1)
        .forEach(([phrase, count]) => res.push({ phrase, count }));
    });
  
    return res
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }
  
  module.exports = { analyzeText };
  