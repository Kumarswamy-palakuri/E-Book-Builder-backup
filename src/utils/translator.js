import { MATH_TRANSLATION_MAP } from '../data/teluguMathTerms.js';
import { getStoredGeminiKey } from './storage.js';

// ============================================================================
// 🔑 GEMINI API KEY DIRECT CODE CONFIGURATION:
// Paste your Google Gemini API key between the quotes below:
// Example: export const HARDCODED_GEMINI_API_KEY = 'AIzaSyD...';
// ============================================================================
export const HARDCODED_GEMINI_API_KEY = '';

/**
 * Resolves the active Gemini API key in order of priority:
 * 1. Explicitly passed parameter
 * 2. Hardcoded key above (HARDCODED_GEMINI_API_KEY)
 * 3. Vite environment variable (VITE_GEMINI_API_KEY)
 * 4. Stored key in browser localStorage
 */
export const getActiveGeminiKey = (passedKey = '') => {
  if (passedKey && passedKey.trim()) return passedKey.trim();
  if (HARDCODED_GEMINI_API_KEY && HARDCODED_GEMINI_API_KEY.trim()) return HARDCODED_GEMINI_API_KEY.trim();
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY.trim();
    if (envKey) return envKey;
  }
  const stored = getStoredGeminiKey();
  if (stored && stored.trim()) return stored.trim();
  return '';
};

/**
 * Intelligent English-to-Mathematical Telugu Translator for Competitive Exams.
 * Translates questions into natural, reasonable, and understandable Telugu sentences
 * as used in official APPSC, TSPSC, RRB, and SSC examination papers.
 */

// Helper: sleep utility for network throttling
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Pre-processes English question text before translation to avoid common neural MT pitfalls
 * (such as translating "pole" to geographic "ధ్రువం", swallowing numbers after currency symbols,
 * or producing dangling colons).
 */
export function preprocessEnglishForExamTelugu(englishText) {
  if (!englishText) return '';
  let text = englishText.trim();

  // 1. Train & Pole disambiguation:
  // "crosses a pole" -> "crosses an electric pole" so Neural MT uses "స్తంభం" instead of "ధ్రువం" (celestial/magnetic pole)
  text = text.replace(/\bcrosses\s+(?:a|an)\s+pole\b/gi, 'crosses an electric pole');
  text = text.replace(/\bcrosses\s+the\s+pole\b/gi, 'crosses the electric pole');
  text = text.replace(/\bcross\s+(?:a|an)\s+pole\b/gi, 'cross an electric pole');
  text = text.replace(/\bcrossing\s+(?:a|an)\s+pole\b/gi, 'crossing an electric pole');
  text = text.replace(/\bstanding\s+pole\b/gi, 'electric pole');
  text = text.replace(/\btelegraph\s+pole\b/gi, 'telegraph post');

  // 2. Currency symbol normalization:
  // Google neural translation swallows numbers when prefixed directly with Rs. or ₹.
  // Converting "Rs. 500" or "₹500" into "500" keeps the number intact in neural MT.
  text = text.replace(/(?:Rs\.?|₹|INR)\s*(\d[\d,]*(\.\d+)?)/gi, '$1');

  // 3. Common mathematical abbreviations
  text = text.replace(/\bp\.a\.\b/gi, 'per annum');
  text = text.replace(/\bp\.a\b/gi, 'per annum');
  text = text.replace(/\bkm\/hr\b/gi, 'km/h');
  text = text.replace(/\bkmph\b/gi, 'km/h');
  text = text.replace(/\bm\/sec\b/gi, 'm/s');
  text = text.replace(/\bC\.?P\.?\b/g, 'cost price');
  text = text.replace(/\bS\.?P\.?\b/g, 'selling price');
  text = text.replace(/\bM\.?P\.?\b/g, 'marked price');
  text = text.replace(/\bS\.?I\.?\b/g, 'simple interest');
  text = text.replace(/\bC\.?I\.?\b/g, 'compound interest');

  // 4. Dangling exam endings (e.g. "that is left is:", "will be:", "find:")
  text = text.replace(/\bthat\s+is\s+left\s+is\s*[:.-]?\s*$/i, 'that is left?');
  text = text.replace(/\bis\s+left\s+is\s*[:.-]?\s*$/i, 'is left?');
  text = text.replace(/\bis\s*:\s*$/i, 'is how much?');
  text = text.replace(/\bwill\s+be\s*:\s*$/i, 'will be how much?');

  return text;
}

/**
 * Calls Gemini AI API to translate English questions into natural, high-standard Telugu exam sentences.
 * Supported models: gemini-1.5-flash, gemini-2.0-flash, gemini-2.5-flash.
 */
export async function translateWithGemini(englishText, apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey || !englishText) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are an expert Telugu translator specializing in competitive exam mathematics and reasoning question papers (such as APPSC, TSPSC, RRB, and SSC exams).
Translate the following English question into natural, grammatically fluent, standard Telugu as used in official Telugu-medium exam papers.

CRITICAL RULES:
1. Do NOT translate word-by-word or literally. Use natural Telugu Subject-Object-Verb (SOV) sentence construction.
2. The sentence must be reasonable, professional, easily understandable, and natural.
3. Official competitive exam terminology:
   - Cost price (CP) -> కొన్న వెల
   - Selling price (SP) -> అమ్మిన వెల
   - Marked price (MP) -> ప్రకటిత వెల
   - Profit / Profit percentage -> లాభం / లాభ శాతం
   - Loss / Loss percentage -> నష్టం / నష్ట శాతం
   - Simple Interest -> సాధారణ వడ్డీ
   - Compound Interest -> చక్రవడ్డీ
   - Principal -> అసలు
   - Train crossing a pole -> స్తంభాన్ని దాటుతుంది (NEVER use ధ్రువం!)
   - Train crossing a platform -> ప్లాట్‌ఫారమ్‌ను దాటుతుంది
   - Ratio -> నిష్పత్తి
   - Average -> సగటు
   - Work & Time: fraction of work left -> మిగిలిన పని భాగం ఎంత?
4. Preserve numbers, currency signs (₹), percentages (%), variables (A, B, x, y), and LaTeX ($...$).
5. Return ONLY the translated Telugu question text, with no introduction, markdown quotes, or notes.

English Question:
${englishText}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return text.trim().replace(/^["'`]+|["'`]+$/g, '');
      }
    }
  } catch (err) {
    console.warn('Gemini translation error:', err?.message || err);
  }

  return null;
}

/**
 * Translates a batch of questions using Gemini in a single request for high speed and consistency.
 */
export async function batchTranslateWithGemini(questions, apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey || !Array.isArray(questions) || questions.length === 0) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const questionsPayload = questions.map((q, idx) => ({
    id: q.id || `q-${idx}`,
    english: q.englishQuestion || ''
  }));

  const prompt = `You are an expert Telugu translator specializing in competitive exam mathematics and reasoning papers (APPSC, TSPSC, RRB, SSC).
Translate the English questions in the JSON array below into natural, reasonable, and understandable Telugu sentences.

CRITICAL RULES:
1. Translate in natural, flowing Telugu sentence structure (SOV), not robotic or word-by-word.
2. Use standard exam terminology: కొన్న వెల (CP), అమ్మిన వెల (SP), ప్రకటిత వెల (MP), సాధారణ వడ్డీ (SI), చక్రవడ్డీ (CI), అసలు (Principal), లాభ శాతం, నష్ట శాతం, సగటు, నిష్పత్తి, స్తంభాన్ని దాటుతుంది (for pole, never ధ్రువం).
3. Preserve numbers, formulas, variables, and LaTeX expressions exactly.
4. Return ONLY a valid JSON array of objects with keys "id" and "teluguQuestion". No explanation, no markdown backticks.

Input Questions JSON:
${JSON.stringify(questionsPayload)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 3000
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleanJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) {
          const map = new Map();
          parsed.forEach(item => {
            if (item.id && item.teluguQuestion) {
              map.set(item.id, item.teluguQuestion.trim());
            }
          });
          return map;
        }
      }
    }
  } catch (err) {
    console.warn('Gemini batch translation error:', err?.message || err);
  }

  return null;
}

/**
 * Free Neural Machine Translation with multi-endpoint fallback and error resilience.
 */
async function translateWithNeuralCloud(text) {
  const clean = text.trim();

  // 1. Google Clients5 (dict-chrome-ex)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=te&q=${encodeURIComponent(clean)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      let raw = '';
      if (Array.isArray(data)) {
        raw = data.map(item => (Array.isArray(item) ? item.join('') : (typeof item === 'string' ? item : ''))).filter(Boolean).join(' ');
      } else if (typeof data === 'string') {
        raw = data;
      }
      if (raw && raw.trim() && /[\u0C00-\u0C7F]/.test(raw)) {
        return raw.trim();
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // 2. Google Clients3 (dict-chrome-ex)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://clients3.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=te&q=${encodeURIComponent(clean)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      let raw = '';
      if (Array.isArray(data)) {
        raw = data.map(item => (Array.isArray(item) ? item.join('') : (typeof item === 'string' ? item : ''))).filter(Boolean).join(' ');
      } else if (typeof data === 'string') {
        raw = data;
      }
      if (raw && raw.trim() && /[\u0C00-\u0C7F]/.test(raw)) {
        return raw.trim();
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // 3. MyMemory API fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|te`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const raw = data?.responseData?.translatedText;
      if (raw && raw.trim() && /[\u0C00-\u0C7F]/.test(raw) && !raw.toLowerCase().includes('mymemory')) {
        return raw.trim();
      }
    }
  } catch (err) {
    // continue to offline engine
  }

  return null;
}

/**
 * Deep Linguistic Context Normalizer for Telugu Competitive Exam Questions.
 * Transforms raw machine translation into fluent, reasonable, professional Telugu sentences.
 */
export function naturalizeExamTelugu(teluguText, originalEnglish = '') {
  if (!teluguText) return '';
  let result = teluguText;

  // 1. Pole vs Celestial pole fix (Crucial for train & motion problems):
  // Machine translation translates "pole" into "ధ్రువం" (geographic/magnetic pole).
  // In competitive exam maths, it is an electric/utility pole: "స్తంభం".
  result = result.replace(/ధ్రువాన్ని\s+దాటుతుంది/g, 'ఒక స్తంభాన్ని దాటుతుంది');
  result = result.replace(/ధ్రువాన్ని/g, 'స్తంభాన్ని');
  result = result.replace(/ధ్రువమును/g, 'స్తంభాన్ని');
  result = result.replace(/ధ్రువం/g, 'స్తంభం');
  result = result.replace(/విద్యుత్\s+స్తంభాన్ని/g, 'స్తంభాన్ని');

  // 2. Standardize Competitive Exam Financial & Math Terminology
  const examTerms = [
    { from: /గుర్తించబడిన\s+ధర/g, to: 'ప్రకటిత వెల' },
    { from: /గుర్తించిన\s+ధరపై/g, to: 'ప్రకటిత వెలపై' },
    { from: /గుర్తించిన\s+ధర/g, to: 'ప్రకటిత వెల' },
    { from: /కొనుగోలు\s+ధరపై/g, to: 'కొన్న వెలపై' },
    { from: /కొనుగోలు\s+ధర/g, to: 'కొన్న వెల' },
    { from: /కొనుగోలు\s+వెల/g, to: 'కొన్న వెల' },
    { from: /\bఖరీదు\b/g, to: 'కొన్న వెల' },
    { from: /అమ్మకపు\s+ధరపై/g, to: 'అమ్మిన వెలపై' },
    { from: /అమ్మకపు\s+ధర/g, to: 'అమ్మిన వెల' },
    { from: /అమ్మకపు\s+వెల/g, to: 'అమ్మిన వెల' },
    { from: /సాధారణ\s+ఆసక్తి/g, to: 'సాధారణ వడ్డీ' },
    { from: /సాధారణ\s+వడ్డీ\s+వడ్డీ/g, to: 'సాధారణ వడ్డీ' },
    { from: /చక్రవడ్డీ\s+వడ్డీ/g, to: 'చక్రవడ్డీ' },
    { from: /సమ్మేళన\s+వడ్డీ/g, to: 'చక్రవడ్డీ' },
    { from: /సమ్మేళనం\s+వార్షిక\s+వడ్డీని/g, to: 'చక్రవడ్డీని' },
    { from: /సమ్మేళనం\s+వడ్డీని/g, to: 'చక్రవడ్డీని' },
    { from: /సమ్మేళనం\s+వడ్డీ/g, to: 'చక్రవడ్డీ' },
    { from: /వార్షికంగా\s+కలిపి/g, to: 'వార్షిక చక్రవడ్డీ లెక్కన' },
    { from: /లాభం\s+శాతం/g, to: 'లాభ శాతం' },
    { from: /నష్టం\s+శాతం/g, to: 'నష్ట శాతం' },
    { from: /రాయితీ\s+శాతం/g, to: 'రాయితీ శాతం' },
    { from: /సగటున/g, to: 'సగటు' },
    { from: /రైలు\s+బండి/g, to: 'రైలు' },
    { from: /ప్లాట్‌ఫారమ్‌ను\s+దాటడానికి/g, to: 'ప్లాట్‌ఫారమ్‌ను దాటడానికి' }
  ];

  examTerms.forEach(item => {
    result = result.replace(item.from, item.to);
  });

  // Contextual term disambiguation based on English question
  if (originalEnglish && /\bcost\s+price\b/i.test(originalEnglish)) {
    result = result.replace(/(^|\s)ధర(\s|[?,.!:]|$)/g, '$1కొన్న వెల$2');
  }
  if (originalEnglish && /\bselling\s+price\b/i.test(originalEnglish)) {
    result = result.replace(/(^|\s)ధర(\s|[?,.!:]|$)/g, '$1అమ్మిన వెల$2');
  }
  if (originalEnglish && /\bmarked\s+price\b/i.test(originalEnglish)) {
    result = result.replace(/(^|\s)ధర(\s|[?,.!:]|$)/g, '$1ప్రకటిత వెల$2');
  }

  // 3. Fix buying & selling verbs (e.g. "విక్రయిస్తూ రూ." -> "కొని, ... కు విక్రయిస్తే"):
  result = result.replace(/(\d+)\s*కి\s+కొనుగోలు\s+చేసి\s+(\d+)\s*కి\s+విక్రయిస్తాడు\.?/g, '₹$1 కు కొని ₹$2 కు అమ్మినచో,');
  result = result.replace(/(\d+)\s*రూపాయలకు\s+కొనుగోలు\s+చేసి\s+(\d+)\s*రూపాయలకు\s+విక్రయించాడు\.?/g, '₹$1 కు కొని ₹$2 కు అమ్మినచో,');
  result = result.replace(/అమ్మినచో[.]/g, 'అమ్మినచో,');
  result = result.replace(/ధర\s+(\d+)\s*రూపాయలు\s+అయితే/g, 'కొన్న వెల ₹$1 అయితే');
  result = result.replace(/ధర\s+(\d+)\s+అయితే/g, 'కొన్న వెల ₹$1 అయితే');

  // 4. Currency symbol restoration & cleanup:
  result = result.replace(/(కొన్న\s+వెల|అమ్మిన\s+వెల|ప్రకటిత\s+వెల|అసలు)\s+(\d[\d,]*)/g, '$1 ₹$2');
  result = result.replace(/(\b\d[\d,]*)\s*పై\s+సంవత్సరానికి/g, '₹$1 అసలుపై సంవత్సరానికి');
  result = result.replace(/(\b\d[\d,]*)\s*పై\s+వార్షిక/g, '₹$1 అసలుపై వార్షిక');
  result = result.replace(/(\d+)\s*పై\s+చక్రవడ్డీ/g, '₹$1 అసలుపై చక్రవడ్డీ');
  result = result.replace(/(\d+)\s*పై\s+సాధారణ\s+వడ్డీ/g, '₹$1 అసలుపై సాధారణ వడ్డీ');
  result = result.replace(/(?:రూ\.\s*)+(\d+)/g, '₹$1');
  result = result.replace(/(?:రూ\.\s*)+₹\s*(\d+)/g, '₹$1');
  result = result.replace(/₹\s*₹\s*(\d+)/g, '₹$1');
  result = result.replace(/\s+రూపాయలు\s+(కనుగొనండి|లెక్కించండి|ఎంత)/g, ' $1');
  result = result.replace(/\s+రూపాయలు/g, '');
  result = result.replace(/రూపాయలపై/g, 'పై');
  result = result.replace(/రూపాయలకు/g, 'లకు');

  // 5. Work & Time phrasing:
  result = result.replace(/మిగిలిన\s+పని\s+యొక్క\s+భిన్నం[:?]?/g, 'మిగిలిన పని భాగం ఎంత?');
  result = result.replace(/పని\s+యొక్క\s+భిన్నం[:?]?/g, 'మిగిలిన పని భాగం ఎంత?');
  result = result.replace(/పని\s+చేయగలరు\.\s*వారు\s+కలిసి/g, 'పూర్తి చేయగలరు. వారు కలిసి');

  // 6. Naturalize robotic "యొక్క" (English "of")
  result = result.replace(/సంఖ్య\s+యొక్క\s+(\d+%)/g, 'సంఖ్యలో $1');
  result = result.replace(/సంఖ్యల\s+యొక్క\s+సగటు/g, 'సంఖ్యల సగటు');
  result = result.replace(/సంఖ్యల\s+యొక్క\s+నిష్పత్తి/g, 'సంఖ్యల నిష్పత్తి');
  result = result.replace(/రైలు\s+యొక్క\s+పొడవు/g, 'రైలు పొడవు');
  result = result.replace(/రైలు\s+యొక్క\s+వేగం/g, 'రైలు వేగం');
  result = result.replace(/వస్తువు\s+యొక్క\s+కొన్న\s+వెల/g, 'వస్తువు కొన్న వెల');
  result = result.replace(/వస్తువు\s+యొక్క\s+అమ్మిన\s+వెల/g, 'వస్తువు అమ్మిన వెల');
  result = result.replace(/వస్తువు\s+యొక్క\s+ప్రకటిత\s+వెల/g, 'వస్తువు ప్రకటిత వెల');

  // 7. Natural question endings:
  result = result.replace(/అంటే\s+ఎంత\??/g, 'ఎంత?');
  result = result.replace(/అంటే\s+ఏమిటి\??/g, 'ఎంత?');
  result = result.replace(/ఏమిటి\??/g, 'ఎంత?');
  result = result.replace(/ఎంత\s+ఉంటుంది\??/g, 'ఎంత?');
  result = result.replace(/కనుగొనబడాలి\??/g, 'కనుగొనండి.');

  // Clean repeated question marks & punctuation
  result = result.replace(/\?+/g, '?');

  // If original English was a question, ensure Telugu ends with a single question mark
  if (originalEnglish && originalEnglish.trim().endsWith('?')) {
    result = result.trim().replace(/[.:;,?]+$/, '') + '?';
  }

  return cleanAndRespaceTelugu(result, originalEnglish);
}

/**
 * High-Quality Offline Structural Synthesizer for Math Exam Questions.
 * Reconstructs standard competitive exam questions into natural, flowing Telugu sentences
 * without ever leaving raw English sentence fragments!
 */
export function synthesizeExamTeluguOffline(englishText) {
  const text = (englishText || '').trim();

  // Pattern 1: Speed, Distance & Trains
  // "A train 240 m in length crosses a pole in 16 seconds. What is the speed of the train?"
  const trainPoleSpeedMatch = text.match(/A\s+train\s+(\d+)\s*m\s*(?:in\s+length|long)\s+crosses\s+(?:an?\s+)?(?:electric\s+)?pole\s+in\s+(\d+)\s*seconds?\.?\s*(?:What\s+is|Find)\s+(?:the\s+)?speed\s+of\s+the\s+train\??/i);
  if (trainPoleSpeedMatch) {
    return `${trainPoleSpeedMatch[1]} మీటర్ల పొడవు గల ఒక రైలు ${trainPoleSpeedMatch[2]} సెకన్లలో ఒక స్తంభాన్ని దాటుతుంది. ఆ రైలు వేగం ఎంత?`;
  }

  // "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?"
  const trainSpeedPoleLenMatch = text.match(/A\s+train\s+running\s+at\s+(?:the\s+)?speed\s+of\s+(\d+)\s*(?:km\/hr|km\/h|kmph)\s+crosses\s+(?:an?\s+)?(?:electric\s+)?pole\s+in\s+(\d+)\s*seconds?\.?\s*(?:What\s+is|Find)\s+(?:the\s+)?length\s+of\s+the\s+train\??/i);
  if (trainSpeedPoleLenMatch) {
    return `గంటకు ${trainSpeedPoleLenMatch[1]} కి.మీ వేగంతో ప్రయాణిస్తున్న ఒక రైలు ${trainSpeedPoleLenMatch[2]} సెకన్లలో ఒక స్తంభాన్ని దాటుతుంది. ఆ రైలు పొడవు ఎంత?`;
  }

  // Pattern 2: Profit & Loss
  // "A person buys an article for Rs. 500 and sells it for Rs. 600. What is the profit percentage?"
  const buySellProfitMatch = text.match(/A\s+(?:person|man|shopkeeper)\s+buys\s+an\s+article\s+for\s+(?:Rs\.?|₹)?\s*(\d+)\s+and\s+sells\s+it\s+for\s+(?:Rs\.?|₹)?\s*(\d+)\.?\s*What\s+is\s+the\s+(profit|loss)\s+percentage\??/i);
  if (buySellProfitMatch) {
    const isProfit = buySellProfitMatch[3].toLowerCase() === 'profit';
    return `ఒక వ్యక్తి ఒక వస్తువును ₹${buySellProfitMatch[1]} కు కొని ₹${buySellProfitMatch[2]} కు అమ్మినచో, అతని ${isProfit ? 'లాభ శాతం' : 'నష్ట శాతం'} ఎంత?`;
  }

  // "A shopkeeper sells an article at 10% discount on the marked price and makes a profit of 20%. If the cost price is Rs. 300, find the marked price."
  const discProfitCpMatch = text.match(/A\s+shopkeeper\s+sells\s+an\s+article\s+at\s+(\d+)%\s+discount\s+on\s+(?:the\s+)?marked\s+price\s+and\s+makes\s+a\s+profit\s+of\s+(\d+)%\.?\s*If\s+(?:the\s+)?cost\s+price\s+is\s+(?:Rs\.?|₹)?\s*(\d+),?\s*(?:find|what\s+is)\s+(?:the\s+)?marked\s+price\??/i);
  if (discProfitCpMatch) {
    return `ఒక దుకాణదారుడు ఒక వస్తువును ప్రకటిత వెలపై ${discProfitCpMatch[1]}% రాయితీతో విక్రయించి ${discProfitCpMatch[2]}% లాభం పొందుతాడు. కొన్న వెల ₹${discProfitCpMatch[3]} అయితే, ప్రకటిత వెల ఎంత?`;
  }

  // Pattern 3: Simple & Compound Interest
  // "Find the compound interest on Rs. 10000 at 10% per annum for 2 years compounded annually."
  const compIntMatch = text.match(/Find\s+(?:the\s+)?compound\s+interest\s+on\s+(?:Rs\.?|₹)?\s*(\d+)\s+at\s+(\d+)%\s+per\s+annum\s+for\s+(\d+)\s+years?(?:\s+compounded\s+annually)?\.?/i);
  if (compIntMatch) {
    return `₹${compIntMatch[1]} అసలుపై సంవత్సరానికి ${compIntMatch[2]}% చొప్పున ${compIntMatch[3]} సంవత్సరాలకు వార్షిక చక్రవడ్డీ ఎంత?`;
  }

  // "Find the simple interest on Rs. 5000 at 8% per annum for 3 years."
  const simpIntMatch = text.match(/Find\s+(?:the\s+)?simple\s+interest\s+on\s+(?:Rs\.?|₹)?\s*(\d+)\s+at\s+(\d+)%\s+per\s+annum\s+for\s+(\d+)\s+years?\.?/i);
  if (simpIntMatch) {
    return `₹${simpIntMatch[1]} అసలుపై సంవత్సరానికి ${simpIntMatch[2]}% సాధారణ వడ్డీ రేటుతో ${simpIntMatch[3]} సంవత్సరాలకు అయ్యే సాధారణ వడ్డీ ఎంత?`;
  }

  // Pattern 4: Time & Work
  // "A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:"
  const workTimeMatch = text.match(/A\s+can\s+do\s+a\s+work\s+in\s+(\d+)\s+days\s+and\s+B\s+in\s+(\d+)\s+days\.?\s*If\s+they\s+work\s+(?:on\s+it\s+)?together\s+for\s+(\d+)\s+days,?\s*then\s+the\s+fraction\s+of\s+(?:the\s+)?work\s+(?:that\s+is\s+)?left\s+is:?/i);
  if (workTimeMatch) {
    return `A ఒక పనిని ${workTimeMatch[1]} రోజులలో, B అదే పనిని ${workTimeMatch[2]} రోజులలో పూర్తి చేయగలరు. వారు కలిసి ${workTimeMatch[3]} రోజులు పనిచేసిన తర్వాత మిగిలిన పని భాగం ఎంత?`;
  }

  // Pattern 5: Percentages & Ratios
  // "What is 20% of 500?"
  const pctOfMatch = text.match(/What\s+is\s+(\d+%?)\s+of\s+(\d+)\??/i);
  if (pctOfMatch) {
    return `${pctOfMatch[2]} లో ${pctOfMatch[1]} ఎంత?`;
  }

  // "Find the ratio of A to B..."
  const ratioMatch = text.match(/find\s+(?:the\s+)?ratio\s+of\s+(.+?)\s+to\s+(.+?)\??/i);
  if (ratioMatch) {
    return `${ratioMatch[1]} మరియు ${ratioMatch[2]} ల నిష్పత్తిని కనుగొనండి.`;
  }

  // General Fallback: Vocabulary replacement with clean structure
  let output = text;
  MATH_TRANSLATION_MAP.forEach(({ en, te }) => {
    output = output.replace(en, te);
  });

  return cleanAndRespaceTelugu(output, text);
}

/**
 * Main translation function: Translates English text to natural Telugu exam text.
 * Uses Gemini AI if key is available, then Free Neural Cloud engines, then Linguistic Normalizer.
 */
export const translateEnglishToTelugu = async (englishText, options = {}) => {
  if (!englishText || !englishText.trim()) return '';

  const cleanText = englishText.trim();
  const apiKey = getActiveGeminiKey(options.geminiKey);

  // 1. Try Gemini AI if API Key is available
  if (apiKey) {
    const aiResult = await translateWithGemini(cleanText, apiKey, options.model || 'gemini-1.5-flash');
    if (aiResult) {
      return cleanAndRespaceTelugu(aiResult, cleanText);
    }
  }

  // 2. Try Enhanced Free Neural Cloud Machine Translation
  const preprocessed = preprocessEnglishForExamTelugu(cleanText);
  const neuralResult = await translateWithNeuralCloud(preprocessed);

  if (neuralResult) {
    return naturalizeExamTelugu(neuralResult, cleanText);
  }

  // 3. Fallback: Intelligent Offline Exam Math Synthesizer
  return synthesizeExamTeluguOffline(cleanText);
};

/**
 * Cleans, fixes irregular spacing, and formats Telugu question text.
 * Ensures proper spacing around numbers, units, punctuation, Telugu conjuncts, and math symbols.
 */
export const cleanAndRespaceTelugu = (teluguText, englishText = '') => {
  if (!teluguText) return '';

  let text = String(teluguText);

  // 1. Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 2. Normalize HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // 3. Fix numbers glued to Telugu letters
  text = text.replace(/(\d+%?)([\u0C00-\u0C7F])/g, '$1 $2');
  text = text.replace(/([\u0C00-\u0C7F])(\d+)/g, '$1 $2');

  // 4. Fix currency symbol spacing
  text = text.replace(/₹\s+(\d+)/g, '₹$1');
  text = text.replace(/(₹\d+)([\u0C00-\u0C7F])/g, '$1 $2');

  // 5. Fix percentage spacing before words
  text = text.replace(/(\d+%)\s*([\u0C00-\u0C7F])/g, '$1 $2');

  // 6. Fix punctuation spacing
  text = text.replace(/\s+([?,.!;:])+/g, '$1');
  text = text.replace(/([,:;])(?=[\u0C00-\u0C7F\w])/g, '$1 ');

  // 7. Ensure question mark at end if English ends with question mark
  if (englishText && englishText.trim().endsWith('?') && !text.trim().endsWith('?')) {
    text = text.trim().replace(/[.]+$/, '') + '?';
  }

  // 8. Fix spaces inside numbers/percentages
  text = text.replace(/(\b\d)\s+(\d)\s+(%)/g, '$1$2$3');
  text = text.replace(/(\b\d)\s+(\d\b)/g, '$1$2');

  // 9. Standardize whitespace
  text = text.replace(/[\t\r\f]+/g, ' ');
  text = text.replace(/ {2,}/g, ' ');

  return text.trim();
};

/**
 * Detects if a Telugu question is missing, invalid, robotic hybrid, or corrupt.
 */
export const isTeluguQuestionInvalid = (teluguQuestion, englishQuestion = '') => {
  if (!teluguQuestion || !teluguQuestion.trim()) return true;

  const tel = teluguQuestion.trim();
  const eng = (englishQuestion || '').trim();

  // 1. Zero Telugu characters
  if (!/[\u0C00-\u0C7F]/.test(tel)) {
    return true;
  }

  // 2. Identical to English (copied English into Telugu field)
  if (eng && tel.toLowerCase() === eng.toLowerCase()) {
    return true;
  }

  // 3. Common corruptions
  if (/undefined|null|NaN|\[object Object\]|#NAME\?|#VALUE!|#REF!/i.test(tel)) {
    return true;
  }

  // 4. Garbled decoding with excess question marks
  const questionMarks = (tel.match(/\?/g) || []).length;
  if (questionMarks > 3 && questionMarks > tel.length * 0.3) {
    return true;
  }

  // 5. Robotic English/Telugu hybrid text:
  // e.g. "A రైలు running at the వేగం of 60..."
  // If text contains substantial English words (> 25% of words are English), it's incomplete/robotic
  const words = tel.split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const englishWords = words.filter(w => /^[a-zA-Z]{2,}$/.test(w));
    if (englishWords.length / words.length > 0.25) {
      return true;
    }
  }

  return false;
};

/**
 * Automatically processes a single question:
 * - If Telugu is missing or invalid, auto-translates from English to Telugu
 * - If forceTranslateAll is true, replaces Telugu with new natural translation
 * - Formats and respaces Telugu question
 * - Leaves English question and all options intact
 */
export const autoTranslateAndRespaceQuestion = async (question, forceTranslateAll = false, options = {}) => {
  if (!question) return question;

  const english = (question.englishQuestion || '').trim();
  let telugu = (question.teluguQuestion || '').trim();
  let wasTranslated = false;
  let wasRespaced = false;

  if (english) {
    if (forceTranslateAll || isTeluguQuestionInvalid(telugu, english)) {
      try {
        const translated = await translateEnglishToTelugu(english, options);
        if (translated && translated.trim()) {
          telugu = translated.trim();
          wasTranslated = true;
        }
      } catch (err) {
        console.warn('Translation error for question:', err);
      }
    }
  }

  const originalTelugu = telugu;
  telugu = cleanAndRespaceTelugu(telugu, english);
  if (telugu !== originalTelugu) {
    wasRespaced = true;
  }

  return {
    ...question,
    teluguQuestion: telugu,
    _teluguAutoTranslated: wasTranslated,
    _teluguRespaced: wasRespaced
  };
};

/**
 * Processes an array of imported questions:
 * - Translates missing/invalid Telugu questions into natural, reasonable exam Telugu
 * - Uses Gemini batch AI translation if key is available, or throttled neural translation
 * - If forceTranslateAll is true, forces re-translation of all questions
 */
export const processImportedQuestionsTelugu = async (questions, onProgress = null, forceTranslateAll = false, options = {}) => {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const apiKey = getActiveGeminiKey(options.geminiKey);

  // Strategy A: If Gemini API Key is available, translate in batches with Gemini AI!
  if (apiKey) {
    const questionsToTranslate = questions.filter(q => {
      const eng = (q.englishQuestion || '').trim();
      const tel = (q.teluguQuestion || '').trim();
      return eng && (forceTranslateAll || isTeluguQuestionInvalid(tel, eng));
    });

    if (questionsToTranslate.length > 0) {
      if (onProgress) {
        onProgress(1, questions.length, 'Translating questions with Gemini AI...');
      }

      const batchSize = 15;
      const translationMap = new Map();

      for (let i = 0; i < questionsToTranslate.length; i += batchSize) {
        const chunk = questionsToTranslate.slice(i, i + batchSize);
        if (onProgress) {
          onProgress(Math.min(i + 1, questions.length), questions.length, `Gemini AI Translating: batch ${Math.floor(i / batchSize) + 1}...`);
        }
        const chunkMap = await batchTranslateWithGemini(chunk, apiKey, options.model || 'gemini-1.5-flash');
        if (chunkMap) {
          chunkMap.forEach((val, key) => translationMap.set(key, val));
        }
      }

      // Map back results
      return questions.map(q => {
        const eng = (q.englishQuestion || '').trim();
        let tel = (q.teluguQuestion || '').trim();
        let wasTranslated = false;

        if (translationMap.has(q.id)) {
          tel = translationMap.get(q.id);
          wasTranslated = true;
        } else if (eng && (forceTranslateAll || isTeluguQuestionInvalid(tel, eng))) {
          // If batch missed it, translate fallback
          tel = synthesizeExamTeluguOffline(eng);
          wasTranslated = true;
        }

        tel = cleanAndRespaceTelugu(tel, eng);
        return {
          ...q,
          teluguQuestion: tel,
          _teluguAutoTranslated: wasTranslated,
          _teluguRespaced: true
        };
      });
    }
  }

  // Strategy B: Enhanced Neural Translation with Throttling (No rate-limit blocks)
  const results = [];
  const batchSize = 2; // Concurrency of 2 to ensure Google neural endpoints never hit 429
  let processedCount = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const batchPromises = batch.map(async (q) => {
      processedCount++;
      if (onProgress) {
        onProgress(processedCount, questions.length, `Translating to natural Telugu: ${processedCount} of ${questions.length}...`);
      }
      return autoTranslateAndRespaceQuestion(q, forceTranslateAll, options);
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Stagger delay between batches to be respectful to free neural endpoints
    if (i + batchSize < questions.length) {
      await sleep(200);
    }
  }

  return results;
};
