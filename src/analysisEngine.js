
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
  
  function analyzeText(raw, keywordRaw) {
    const text = normalizeText(raw).trim();
    const keyword = (keywordRaw || '').toLowerCase().trim();
  
    const characters = text.length;
    const spaces = (text.match(/ /g) || []).length;
    const charactersNoSpaces = characters - spaces;
  
    const paragraphs = text
      ? text.split(/\n{2,}/).filter(p => p.trim().length > 0).length
      : 0;
  
    let sentenceCount = 0;
    if (text) {
      const punctuated = text.match(/[^.!?]+[.!?]+/g) || [];
      const leftover = text.replace(/[^.!?]+[.!?]+/g, '').trim();
      const lineSentences = leftover
        ? leftover.split('\n').filter(s => s.trim().length > 0)
        : [];
      sentenceCount = punctuated.length + lineSentences.length;
      if (sentenceCount === 0 && text.length > 0) sentenceCount = 1;
    }
  
    const tokens = tokenizeWords(text);
    const wordCount = tokens.length;
  
    const readingTimeSeconds = wordCount ? wordCount / (225 / 60) : 0;
    const speakingTimeSeconds = wordCount ? wordCount / (150 / 60) : 0;
    const pageCount = wordCount ? Math.ceil(wordCount / 500) : 0;
  
    // Keyword stats
    let keywordCount = 0;
    let keywordDensity = 0;
    if (keyword && wordCount) {
      const re = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      keywordCount = (text.match(re) || []).length;
      keywordDensity = +((keywordCount / wordCount) * 100).toFixed(2);
    }
  
    const topKeywords = buildTopKeywords(tokens, wordCount);
    const repeatedPhrases = buildRepeatedPhrases(tokens);
  
    const warnings = [];
    if (wordCount) {
      if (keyword && keywordDensity > 5 && wordCount > 200) {
        warnings.push(
          `High focus on "${keyword}" (${keywordDensity}% of words). Might look like keyword stuffing.`
        );
      }
      if (sentenceCount && wordCount / sentenceCount > 35) {
        warnings.push('Average sentence length is high. Shorten sentences for clarity.');
      }
      if (paragraphs && wordCount / paragraphs > 200) {
        warnings.push('Paragraphs are very long. Break them up for readability.');
      }
      if (!keyword && topKeywords[0] && topKeywords[0].density > 7 && wordCount > 300) {
        warnings.push(
          `Text leans heavily on "${topKeywords[0].word}". Consider wording variety.`
        );
      }
    }
  
    return {
      wordCount,
      characters,
      charactersNoSpaces,
      spaces,
      sentenceCount,
      paragraphCount,
      readingTimeSeconds,
      speakingTimeSeconds,
      pageCount,
      keyword,
      keywordCount,
      keywordDensity,
      topKeywords,
      repeatedPhrases,
      warnings
    };
  }
  
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
  