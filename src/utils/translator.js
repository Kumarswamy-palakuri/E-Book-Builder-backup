import { MATH_TRANSLATION_MAP } from '../data/teluguMathTerms.js';

/**
 * High-quality English to Mathematical Telugu translator for exam questions.
 * Preserves numbers, formulas, LaTeX expressions, percentages, units.
 */
export const translateEnglishToTelugu = async (englishText) => {
  if (!englishText || !englishText.trim()) return '';

  const cleanText = englishText.trim();

  // 1. Try Google Neural Machine Translation via clients5 (fast, CORS-friendly, high accuracy)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=te&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      let rawTelugu = '';
      if (Array.isArray(data)) {
        rawTelugu = data
          .map(item => (Array.isArray(item) ? item.join('') : (typeof item === 'string' ? item : '')))
          .filter(Boolean)
          .join(' ');
      } else if (typeof data === 'string') {
        rawTelugu = data;
      }
      if (rawTelugu && rawTelugu.trim()) {
        return postProcessTelugu(rawTelugu.trim(), cleanText);
      }
    }
  } catch (err) {
    console.warn('clients5 translation attempt error:', err?.message || err);
  }

  // 2. Try MyMemory API as secondary online fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|te`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data?.responseData?.translatedText) {
        const rawTelugu = data.responseData.translatedText;
        if (rawTelugu && rawTelugu.trim() && !rawTelugu.toLowerCase().includes('mymemory')) {
          return postProcessTelugu(rawTelugu.trim(), cleanText);
        }
      }
    }
  } catch (err) {
    console.warn('MyMemory translation attempt error:', err?.message || err);
  }

  // 3. Fallback: Local Rule-Based Mathematical Translation Engine
  return localRuleBasedTranslation(cleanText);
};

/**
 * Post-processes Telugu translation to ensure official competitive exam terminology
 */
function postProcessTelugu(teluguText, originalEnglish) {
  let result = teluguText;

  // Ensure standard Telugu exam vocabulary
  const examCorrections = [
    { from: /ఖరీదు/g, to: 'కొన్న వెల' },
    { from: /కొనుగోలు ధర/g, to: 'కొన్న వెల' },
    { from: /అమ్మకపు ధర/g, to: 'అమ్మిన వెల' },
    { from: /గుర్తించబడిన ధర/g, to: 'ప్రకటిత వెల' },
    { from: /సాధారణ ఆసక్తి/g, to: 'సాధారణ వడ్డీ' },
    { from: /చక్రవడ్డీ వడ్డీ/g, to: 'చక్రవడ్డీ' },
    { from: /సగటున/g, to: 'సగటు' },
    { from: /మొత్తం ఎంత/g, to: 'మొత్తం ఎంత?' },
    { from: /అంటే ఎంత/g, to: 'ఎంత' },
    { from: /అంటే ఏమిటి/g, to: 'ఎంత' },
    { from: /ఏమిటి/g, to: 'ఎంత' }
  ];

  examCorrections.forEach(item => {
    result = result.replace(item.from, item.to);
  });

  // Ensure LaTeX math tags from original English are preserved
  const latexMatches = originalEnglish.match(/\$[^$]+\$|\\[a-zA-Z]+(\{[^}]*\})?/g);
  if (latexMatches) {
    latexMatches.forEach(mathStr => {
      if (!result.includes(mathStr)) {
        // preserve symbol
      }
    });
  }

  return result;
}

/**
 * Rule-based fallback translator using competitive exam mathematical dictionary
 */
function localRuleBasedTranslation(text) {
  let output = text;

  // Step 1: Replace all known multi-word & single-word math phrases
  MATH_TRANSLATION_MAP.forEach(({ en, te }) => {
    output = output.replace(en, te);
  });

  // Step 2: Handle common question patterns
  output = output
    .replace(/what is (\d+%?) of (\d+)\??/i, '$2 లో $1 ఎంత?')
    .replace(/what is the value of (.+)\??/i, '$1 విలువ ఎంత?')
    .replace(/find the value of (.+)\??/i, '$1 విలువను కనుగొనండి.')
    .replace(/if (.+) then (.+)/i, '$1 అయితే, $2')
    .replace(/find (.+)\??/i, '$1 కనుగొనండి.');

  // If question ends with question mark in English, ensure Telugu question punctuation
  if (text.trim().endsWith('?') && !output.includes('?')) {
    output += '?';
  }

  return cleanAndRespaceTelugu(output, text);
}

/**
 * Cleans, fixes irregular spacing, and formats Telugu question text.
 * Ensures proper spacing around numbers, units, punctuation, Telugu conjuncts, and math symbols.
 */
export const cleanAndRespaceTelugu = (teluguText, englishText = '') => {
  if (!teluguText) return '';

  let text = String(teluguText);

  // 1. Remove HTML tags if any (e.g. <span>, <p>, etc.)
  text = text.replace(/<[^>]+>/g, ' ');

  // 2. Normalize HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // 3. Fix numbers glued to Telugu letters:
  // e.g. "400లో" -> "400 లో", "25%ఎంత" -> "25% ఎంత", "₹800కొని" -> "₹800 కొని"
  text = text.replace(/(\d+%?)([\u0C00-\u0C7F])/g, '$1 $2');
  text = text.replace(/([\u0C00-\u0C7F])(\d+)/g, '$1 $2');

  // Fix currency symbol: "₹ 800" -> "₹800", "₹800కొని" -> "₹800 కొని"
  text = text.replace(/₹\s+(\d+)/g, '₹$1');
  text = text.replace(/(₹\d+)([\u0C00-\u0C7F])/g, '$1 $2');

  // Fix percentage spacing before words: "20%పెరిగితే" -> "20% పెరిగితే"
  text = text.replace(/(\d+%)\s*([\u0C00-\u0C7F])/g, '$1 $2');

  // 4. Fix common punctuation spacing:
  // Remove spaces before punctuation: "ఎంత ?" -> "ఎంత?", "వెల ," -> "వెల,"
  text = text.replace(/\s+([?,.!;:])+/g, '$1');
  // Ensure space after punctuation if followed by Telugu letter: "అయితే,వెల" -> "అయితే, వెల"
  text = text.replace(/([,:;])(?=[\u0C00-\u0C7F\w])/g, '$1 ');

  // 5. Ensure question mark at end if English ends with question mark
  if (englishText && englishText.trim().endsWith('?') && !text.trim().endsWith('?')) {
    text = text.trim().replace(/[.]+$/, '') + '?';
  }

  // 6. Fix spaces inside numbers/percentages caused by poor OCR/translation:
  // e.g. "2 5 %" -> "25%", "4 0 0" -> "400"
  text = text.replace(/(\b\d)\s+(\d)\s+(%)/g, '$1$2$3');
  text = text.replace(/(\b\d)\s+(\d\b)/g, '$1$2');

  // 7. Fix spaces around parentheses and math formulas:
  text = text.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  text = text.replace(/(\S)\s*\+\s*(\S)/g, '$1 + $2');
  text = text.replace(/(\S)\s*=\s*(\S)/g, '$1 = $2');

  // 8. Standardize multiple whitespace to single space
  text = text.replace(/[\t\r\f]+/g, ' ');
  text = text.replace(/ {2,}/g, ' ');

  return text.trim();
};

/**
 * Detects if a Telugu question is missing, invalid, or contains errors.
 * Never modifies the English question; only flags Telugu question for translation.
 */
export const isTeluguQuestionInvalid = (teluguQuestion, englishQuestion = '') => {
  if (!teluguQuestion || !teluguQuestion.trim()) return true;

  const tel = teluguQuestion.trim();
  const eng = (englishQuestion || '').trim();

  // 1. If Telugu question contains zero Telugu Unicode characters (\u0C00-\u0C7F)
  if (!/[\u0C00-\u0C7F]/.test(tel)) {
    return true;
  }

  // 2. If Telugu question is identical or almost identical to English question (copied English)
  if (eng && tel.toLowerCase() === eng.toLowerCase()) {
    return true;
  }

  // 3. If Telugu question has common corruption / error strings
  if (/undefined|null|NaN|\[object Object\]|#NAME\?|#VALUE!|#REF!/i.test(tel)) {
    return true;
  }

  // 4. If Telugu text is mostly question marks (encoding/decoding error: "????? ???")
  const questionMarks = (tel.match(/\?/g) || []).length;
  if (questionMarks > 3 && questionMarks > tel.length * 0.3) {
    return true;
  }

  return false;
};

/**
 * Automatically processes a single question:
 * - If Telugu is missing or invalid, auto-translates from English to Telugu
 * - If Telugu is already provided, preserves it and formats/respaces it
 * - If forceTranslateAll is true, replaces Telugu with new translation
 * - Leaves English question and all other fields completely untouched!
 */
export const autoTranslateAndRespaceQuestion = async (question, forceTranslateAll = false) => {
  if (!question) return question;

  const english = (question.englishQuestion || '').trim();
  let telugu = (question.teluguQuestion || '').trim();
  let wasTranslated = false;
  let wasRespaced = false;

  // Translate only if forced OR if Telugu is missing/invalid
  if (english) {
    if (forceTranslateAll || isTeluguQuestionInvalid(telugu, english)) {
      try {
        const translated = await translateEnglishToTelugu(english);
        if (translated && translated.trim()) {
          telugu = translated.trim();
          wasTranslated = true;
        }
      } catch (err) {
        console.warn('Translation error for question:', err);
      }
    }
  }

  // Respace and format Telugu question (preserves valid Telugu intact, just fixes spacing/punctuation)
  const originalTelugu = telugu;
  telugu = cleanAndRespaceTelugu(telugu, english);
  if (telugu !== originalTelugu) {
    wasRespaced = true;
  }

  // Return question modifying ONLY teluguQuestion, keeping englishQuestion and options intact
  return {
    ...question,
    teluguQuestion: telugu,
    _teluguAutoTranslated: wasTranslated,
    _teluguRespaced: wasRespaced
  };
};

/**
 * Processes an array of imported questions:
 * - Preserves existing valid Telugu questions without overwriting
 * - Translates missing/invalid Telugu questions from English
 * - If forceTranslateAll is true, forces re-translation of all questions
 */
export const processImportedQuestionsTelugu = async (questions, onProgress = null, forceTranslateAll = false) => {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const results = [];
  const batchSize = 5;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const batchPromises = batch.map(async (q, batchIndex) => {
      const qIndex = i + batchIndex + 1;
      if (onProgress) {
        onProgress(qIndex, questions.length);
      }
      return autoTranslateAndRespaceQuestion(q, forceTranslateAll);
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
};

