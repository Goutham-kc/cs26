// services/yaksha.js — v1 lightweight content auditor
// Swap body with an ML/LLM call on the scale path (see spec §9).

const BLOCKLIST  = ['spam', 'test123', 'asdf', 'idk', 'dunno', 'lol', 'wtf', 'qwerty', 'asdfgh', 'zxcvbn'];
const MIN_LENGTH = 20;
const MIN_WORDS  = 3;
const MIN_UNIQUE_WORDS = 2;

const KEYBOARD_ROWS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
];

const STOPWORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','can','to',
  'of','in','for','on','with','at','by','from','as','into','through','during',
  'and','but','or','nor','so','yet','both','either','neither','not','only',
  'own','same','than','too','very','just','also','now','here','there','when',
  'where','why','how','all','each','every','both','few','more','most','other',
  'some','such','no','any','this','that','these','those','it','its','i','me',
  'my','we','our','you','your','he','she','him','her','they','them','their',
  'what','which','who','whom','whose','if','else','while','about','up','down',
  'out','over','under','again','further','then','once','get','got','make','made'
]);

const QUERY_SYNONYMS = {
  'bug': ['error','issue','problem','crash','broken','fix','defect'],
  'error': ['bug','issue','problem','crash','exception','fail'],
  'install': ['setup','configure','setup','deployment','deploy'],
  'deploy': ['deployment','release','publish','launch'],
  'login': ['signin','sign in','authenticate','log in','access'],
  'password': ['passcode','credential','auth'],
  'api': ['endpoint','rest','request','response','http'],
  'database': ['db','sql','mongodb','data','storage'],
  'config': ['configuration','settings','setup'],
  'test': ['testing','qa','verification'],
  'build': ['compile','package'],
  'run': ['execute','start','launch'],
  'update': ['upgrade','modify','change'],
  'delete': ['remove','clear','drop','erase'],
  'create': ['add','new','make','generate'],
  'view': ['see','show','display','read'],
  'submit': ['send','post','push','upload'],
  'fetch': ['get','retrieve','pull','load'],
  'server': ['backend','service','host'],
  'client': ['frontend','ui','interface'],
  'timeout': ['slow','delay','hang','freeze'],
  'crash': ['freeze','hang','stop','fail','break'],
  'performance': ['slow','speed','lag','fast','optimize']
};

function hasKeyboardPattern(clean) {
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i <= row.length - 4; i++) {
      if (clean.includes(row.slice(i, i + 4))) return true;
    }
  }
  return false;
}

function hasNumericPattern(clean) {
  return /^\d+$|(\d\s*){4,}/.test(clean) || /(.)\1{3,}/.test(clean);
}

function countRealWords(tokens) {
  return tokens.filter(t => t.length > 2 && /^[a-z]+$/.test(t)).length;
}

function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  return words.filter(w => !STOPWORDS.has(w));
}

function getSynonyms(word) {
  const syns = [];
  if (QUERY_SYNONYMS[word]) syns.push(...QUERY_SYNONYMS[word]);
  for (const [key, vals] of Object.entries(QUERY_SYNONYMS)) {
    if (vals.includes(word)) syns.push(key);
  }
  return syns;
}

function isBlatantlyIrrelevant(queryText, answerText) {
  const queryWords = new Set(extractKeywords(queryText));
  const answerWords = new Set(extractKeywords(answerText));

  if (queryWords.size === 0 || answerWords.size === 0) return false;

  let connectionFound = false;
  for (const qWord of queryWords) {
    if (answerWords.has(qWord)) {
      connectionFound = true;
      break;
    }
    const syns = getSynonyms(qWord);
    if (syns.some(s => answerWords.has(s))) {
      connectionFound = true;
      break;
    }
  }

  return !connectionFound;
}

async function yakshaAudit(text, context = {}) {
  const clean = text.trim().toLowerCase();

  if (clean.length < MIN_LENGTH) {
    return { passed: false, reason: `Answer too short — minimum ${MIN_LENGTH} characters` };
  }

  const tokens = clean.split(/\s+/);

  if (tokens.length < MIN_WORDS) {
    return { passed: false, reason: `Answer must have at least ${MIN_WORDS} words` };
  }

  if (hasKeyboardPattern(clean)) {
    return { passed: false, reason: 'Keyboard pattern detected — gibberish not allowed' };
  }

  if (hasNumericPattern(clean)) {
    return { passed: false, reason: 'Numeric-only or repeated-character patterns not allowed' };
  }

  if (BLOCKLIST.some(word => clean.includes(word))) {
    return { passed: false, reason: 'Blocked content detected by Yaksha' };
  }

  const unique = new Set(tokens).size;
  if (tokens.length > 4 && unique / tokens.length < 0.6) {
    return { passed: false, reason: 'Low-quality repetitive payload' };
  }

  const realWords = countRealWords(tokens);
  if (realWords < MIN_UNIQUE_WORDS) {
    return { passed: false, reason: 'Answer must contain meaningful words, not just random characters' };
  }

  const { queryText } = context;
  if (queryText && isBlatantlyIrrelevant(queryText, clean)) {
    return { passed: false, reason: 'Answer appears to be unrelated to the query' };
  }

  return { passed: true };

  // --- SCALE PATH ---
  // const response = await openai.moderations.create({ input: text });
  // return { passed: !response.results[0].flagged };
}

module.exports = { yakshaAudit };