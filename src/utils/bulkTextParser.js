/**
 * Normalizes a string by converting to lowercase, replacing symbols with spaces,
 * expanding '&' to 'and', and collapsing multiple spaces.
 * Preserves Telugu Unicode characters (\u0C00-\u0C7F) and alphanumeric characters.
 */
export const normalizeChapterString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0C00-\u0C7F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Strips image tags from solution text if a solutionImageUrl is provided,
 * preventing images from being rendered twice (once by MathRenderer and once by <img>).
 */
export const getCleanSolutionText = (solutionText = '', solutionImageUrl = '') => {
  if (!solutionText || typeof solutionText !== 'string') return '';
  if (!solutionImageUrl) return solutionText;

  const lines = solutionText.split(/\r?\n/);
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (solutionImageUrl && trimmed.includes(solutionImageUrl)) return false;
    if (solutionImageUrl && /^(?:Solution\s*)?(?:Image|Diagram|Figure|Fig|Img|చిత్రం)\s*[:.]/i.test(trimmed)) {
      return false;
    }
    return true;
  });

  return cleanedLines.join('\n').trim();
};

/**
 * Competitive exam chapter synonyms, plurals, and standard abbreviations
 */
export const CHAPTER_ALIASES = {
  1: ['percentages', 'percentage', 'pct', 'శాతాలు'],
  2: ['profit and loss', 'profit & loss', 'profit loss', 'p&l', 'p and l', 'pl', 'లాభనష్టాలు', 'లాభాలు నష్టాలు'],
  3: ['discounts', 'discount', 'disc', 'రాయితీ', 'డిస్కౌంట్'],
  4: ['simple interest', 'simple interests', 'si', 'సాధారణ వడ్డీ', 'బారువడ్డీ'],
  5: ['compound interest', 'compound interests', 'ci', 'చక్రవడ్డీ'],
  6: ['ratio and proportion', 'ratios and proportions', 'ratio & proportion', 'ratio proportion', 'rat', 'నిష్పత్తి', 'అనుపాతం'],
  7: ['problems on ages', 'problem on ages', 'problems on age', 'age problems', 'ages', 'age', 'వయస్సులు', 'వయస్సు'],
  8: ['partnerships', 'partnership', 'part', 'భాగస్వామ్యం'],
  9: ['mixtures and alligations', 'mixture and alligation', 'mixtures & alligations', 'mixture & alligation', 'alligation and mixture', 'alligation & mixture', 'alligations', 'alligation', 'mixtures', 'mixture', 'mix', 'మిశ్రమాలు'],
  10: ['averages', 'average', 'avg', 'సగటు'],
  11: ['time and work', 'time & work', 'time work', 'tw', 'కాలము మరియు పని', 'కాలము పని'],
  12: ['pipes and cisterns', 'pipes & cisterns', 'pipe and cistern', 'pipe & cistern', 'pipes cisterns', 'pipe cistern', 'pc', 'గొట్టాలు', 'తొట్టెలు'],
  13: ['time speed and distance', 'time speed & distance', 'speed time and distance', 'speed time & distance', 'speed and distance', 'time and distance', 'time & distance', 'time distance', 'speed distance', 'tsd', 'td', 'వేగం కాలం దూరం', 'కాలము దూరం'],
  14: ['problems on trains', 'problem on trains', 'trains', 'train', 'trn', 'రైళ్లు', 'రైలు'],
  15: ['race and circular motion', 'races and circular motion', 'races & circular motion', 'race & circular motion', 'circular motion', 'races', 'race', 'పరుగు పందాలు', 'వృత్తాకార చలనం'],
  16: ['boats and streams', 'boats & streams', 'boat and stream', 'boat & stream', 'boats streams', 'boat stream', 'bs', 'పడవలు మరియు ప్రవాహాలు', 'పడవలు'],
  17: ['number systems', 'number system', 'numbers', 'num sys', 'num', 'సంఖ్యా వ్యవస్థ'],
  18: ['hcf and lcm', 'hcf & lcm', 'lcm and hcf', 'lcm & hcf', 'hcf lcm', 'lcm hcf', 'hcf', 'lcm', 'కసాగు', 'గసాభా'],
  19: ['simplifications', 'simplification', 'bodmas', 'approx', 'approximation', 'simp', 'సూక్ష్మీకరణ'],
  20: ['algebra', 'algebraic expressions', 'alg', 'బీజగణితం'],
  21: ['trigonometry', 'trig', 'trigo', 'త్రికోణమితి'],
  22: ['heights and distances', 'heights & distances', 'height and distance', 'height & distance', 'hd', 'ఎత్తులు మరియు దూరాలు', 'ఎత్తులు దూరాలు'],
  24: ['coordinate geometry', 'co-ordinate geometry', 'co ordinate geometry', 'coordinates', 'coord', 'నిరూపక రేఖాగణితం'],
  23: ['geometry', 'lines and angles', 'triangles', 'circles', 'geom', 'రేఖాగణితం'],
  25: ['mensuration 2d', '2d mensuration', 'mensuration2d', '2d geometry', 'perimeter and area', 'area and perimeter', 'm2d', 'క్షేత్రమితి 2d', 'క్షేత్రమితి'],
  26: ['mensuration 3d', '3d mensuration', 'mensuration3d', 'surface area and volume', 'volume and surface area', 'm3d', 'క్షేత్రమితి 3d'],
  27: ['statistics', 'mean median mode', 'stat', 'stats', 'సాంఖ్యకశాస్త్రం'],
  28: ['probability', 'probabilities', 'prob', 'సంభావ్యత'],
  29: ['data interpretation', 'di', 'charts and graphs', 'pie chart', 'bar graph', 'table chart', 'దత్తాంశ విశ్లేషణ']
};

/**
 * Auto-detects matching chapter from filename (e.g., '01. Percentage.txt', '10. Average.docx', '2. Profit & Loss.txt', 'P&L.txt')
 * Supports:
 * - Leading numbers / order prefixes: 01. Percentage.txt, 1_percentage.txt, 5_compound_interest.txt, 20_algebra.txt
 * - Chapter IDs: ch-1, ch-05, ch20, Ch 1, Ch-12
 * - Chapter Codes: PCT, PL, CI, SI, RAT, NUM, ALG, TSD, P&L
 * - Full or partial English names, plurals & synonyms: compound_interest, time-and-work, pipes and cisterns
 * - Telugu chapter names: శాతాలు, చక్రవడ్డీ, లాభనష్టాలు
 */
export const detectChapterFromFilename = (fileName, chapters = []) => {
  if (!fileName || !chapters || chapters.length === 0) return null;

  // Clean filename: remove path and extensions (.txt, .json, .docx, .xlsx, .csv, etc.)
  const cleanName = fileName.replace(/^.*[\\/]/, '').replace(/\.[a-zA-Z0-9]+$/g, '').trim();
  const lowerClean = cleanName.toLowerCase();
  const normClean = normalizeChapterString(cleanName);

  // 1. Direct ID match (e.g. "ch-5", "ch05", "ch-05", "ch_5")
  const idMatch = chapters.find(c => {
    const cIdLower = c.id.toLowerCase();
    const cIdAlpha = cIdLower.replace(/[^a-z0-9]/g, '');
    const cleanAlpha = lowerClean.replace(/[^a-z0-9]/g, '');
    return cIdLower === lowerClean || cIdAlpha === cleanAlpha;
  });
  if (idMatch) return idMatch;

  // 2. Direct Code match (e.g. "PCT", "CI", "RAT", "NUM")
  const codeMatch = chapters.find(c => c.code && c.code.toLowerCase() === lowerClean);
  if (codeMatch) return codeMatch;

  // 3. Telugu name match (full or substring)
  for (const c of chapters) {
    if (c.teluguName) {
      if (cleanName.includes(c.teluguName)) return c;
      const cleanTeluguName = c.teluguName.replace(/[\/&]/g, ' ').replace(/\s+/g, ' ').trim();
      const parts = cleanTeluguName.split(/\s+/).filter(p => p.length >= 3);
      if (parts.some(p => cleanName.includes(p))) return c;
    }
  }

  // 4. Order number prefix detection:
  // e.g. "01. Percentage", "10. Average", "25. Mensuration 2D", "05_Compound_Interest", "Ch-12 Pipes and Cisterns", "01.txt"
  const orderPatterns = [
    /^(?:(?:ch(?:apter)?|unit|part|topic|lesson|maths?|rrb|ssc)[\s_.-]*)?0*(\d{1,2})(?:[\s_.:\)\-\/]+(.*)|$)/i,
    /(?:^|[\s_.-])(?:ch(?:apter)?|unit|part)[\s_.-]*0*(\d{1,2})(?:[\s_.:\)\-\/]+(.*)|$)/i,
    /^0*(\d{1,2})(?:[\s_.:\)\-\/]+(.*)|$)/i
  ];

  for (const pattern of orderPatterns) {
    const match = lowerClean.match(pattern);
    if (match && match[1]) {
      const orderNum = parseInt(match[1], 10);
      const chapterByOrder = chapters.find(c => c.order === orderNum);
      if (chapterByOrder) {
        const suffix = match[2];
        if (!suffix || !suffix.trim()) return chapterByOrder;

        const normSuffix = normalizeChapterString(suffix);
        const normChapName = normalizeChapterString(chapterByOrder.name);
        const compSuffix = normSuffix.replace(/\s+/g, '');
        const compChapName = normChapName.replace(/\s+/g, '');

        // If suffix matches or contains the chapter name
        if (
          normChapName.includes(normSuffix) ||
          normSuffix.includes(normChapName) ||
          compChapName.includes(compSuffix) ||
          compSuffix.includes(compChapName)
        ) {
          return chapterByOrder;
        }

        // Check if suffix matches another chapter (in case of misnumbered files, e.g. "05_percentage.txt")
        const otherMatch = chapters.find(c => {
          const oNorm = normalizeChapterString(c.name);
          return normSuffix.includes(oNorm) || oNorm.includes(normSuffix);
        });
        if (otherMatch) return otherMatch;

        return chapterByOrder;
      }
    }
  }

  // 5. Flatten and sort all competitive exam aliases by length (longest phrase first!)
  // Ensures "coordinate geometry" matches before "geometry", "time speed and distance" before "time and work", etc.
  const allAliases = [];
  for (const [orderStr, aliases] of Object.entries(CHAPTER_ALIASES)) {
    const orderNum = parseInt(orderStr, 10);
    const targetChapter = chapters.find(c => c.order === orderNum);
    if (!targetChapter) continue;

    for (const alias of aliases) {
      allAliases.push({
        chapter: targetChapter,
        alias: alias,
        normAlias: normalizeChapterString(alias)
      });
    }
  }
  allAliases.sort((a, b) => b.normAlias.length - a.normAlias.length);

  for (const item of allAliases) {
    const { chapter, normAlias } = item;
    if (!normAlias) continue;

    // Strict word-boundary regex
    const regex = new RegExp('(?:^|\\b|[\\s_.-])' + escapeRegex(normAlias) + '(?:$|\\b|[\\s_.-])', 'i');
    if (regex.test(normClean) || normClean === normAlias) {
      return chapter;
    }

    // Only allow compact substring matching if alias is long (>= 5 letters) to prevent false positives
    if (normAlias.length >= 5) {
      const compAlias = normAlias.replace(/\s+/g, '');
      const compClean = normClean.replace(/\s+/g, '');
      if (compClean.includes(compAlias)) {
        return chapter;
      }
    }
  }

  // 6. Substring match against chapter names (longest first)
  const sortedChapters = [...chapters].sort((a, b) => b.name.length - a.name.length);
  for (const c of sortedChapters) {
    const normName = normalizeChapterString(c.name);
    if (normName && (normClean.includes(normName) || normName.includes(normClean))) {
      return c;
    }
    const compName = normName.replace(/\s+/g, '');
    const compClean = normClean.replace(/\s+/g, '');
    if (compName && compClean && compName.length >= 5 && (compClean.includes(compName) || compName.includes(compClean))) {
      return c;
    }
  }

  return null;
};

/**
 * Parser for structured text bulk import
 */
export const parseStructuredBulkText = (rawText, chapters = [], defaultChapterId = null) => {
  if (!rawText || !rawText.trim()) {
    return { questions: [], errors: ['Input text is empty'] };
  }

  const errors = [];
  const parsedQuestions = [];

  // Try to detect default chapter from defaultChapterId or header if specified
  let activeChapterId = defaultChapterId || chapters[0]?.id || 'ch-1';
  const chapterMatch = rawText.match(/Chapter\s*:\s*([^\n\r]+)/i);
  if (chapterMatch && chapterMatch[1]) {
    const chapterName = chapterMatch[1].trim();
    const foundChapter = chapters.find(
      c => c.name.toLowerCase() === chapterName.toLowerCase() ||
           c.teluguName?.toLowerCase() === chapterName.toLowerCase() ||
           chapterName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (foundChapter) {
      activeChapterId = foundChapter.id;
    }
  }

  // Split rawText into question blocks. Questions typically start with Q1:, Q.1, Q 1, Question 1, or 1.
  const questionBlocks = rawText.split(/(?=(?:^|\n|\r)\s*(?:Q\.?\s*\d+[\s:.]*|Question\s+\d+[\s:.]*|\d+\.\s+))/i);

  let questionIndex = 0;

  for (const block of questionBlocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith('Chapter:')) continue;

    questionIndex++;

    // Look for fields inside the block
    let english = '';
    let telugu = '';
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let answer = '';
    let examName = 'RRB / SSC Exam';
    let examDate = new Date().toISOString().split('T')[0];
    let shift = 'Shift-01';
    let difficulty = 'Medium';
    let topic = '';
    let solution = '';
    let imageUrl = '';

    // Check specific Chapter tag within the block if any
    const blockChapterMatch = trimmed.match(/Chapter\s*:\s*([^\n\r]+)/i);
    let blockChapterId = activeChapterId;
    if (blockChapterMatch && blockChapterMatch[1]) {
      const cName = blockChapterMatch[1].trim();
      const found = chapters.find(c => c.name.toLowerCase() === cName.toLowerCase());
      if (found) blockChapterId = found.id;
    }

    // Locate where the Solution begins (if present) so we never mistake solution images for question diagrams
    const solHeaderMatch = trimmed.match(/(?:^|\r?\n)\s*(?:(?:Detailed\s+)?(?:Solution|Explanation)|Ans(?:wer)?\s*Explanation|Sol\b|Exp\b|వివరణ|పరిష్కారం)\s*[:.-]?/i);
    const solStartIndex = solHeaderMatch ? solHeaderMatch.index : -1;
    const questionPart = solStartIndex !== -1 ? trimmed.substring(0, solStartIndex) : trimmed;
    const solutionPart = solStartIndex !== -1 ? trimmed.substring(solStartIndex) : '';

    // Question Image / Diagram extraction (searches ONLY within questionPart)
    let questionImageUrl = '';
    const qImgMatch = questionPart.match(/(?:^|\r?\n)\s*(?:Question\s*(?:Image|Diagram|Figure|Fig|Img|చిత్రం)|Image|Diagram|Figure|Fig|Img|చిత్రం)\s*[:.]?\s*(?:\r?\n\s*)?([^\n\r]+)/i);
    if (qImgMatch && qImgMatch[1]) {
      const rawImg = qImgMatch[1].trim();
      const mdMatch = rawImg.match(/!\[.*?\]\((.*?)\)/);
      if (mdMatch) {
        questionImageUrl = mdMatch[1].trim();
      } else {
        const htmlMatch = rawImg.match(/src=["'](.*?)["']/);
        if (htmlMatch) {
          questionImageUrl = htmlMatch[1].trim();
        } else {
          questionImageUrl = rawImg.replace(/^['"<]+|['">]+$/g, '').trim();
        }
      }
    } else {
      const inlineMd = questionPart.match(/!\[.*?\]\((.*?)\)/);
      if (inlineMd) {
        questionImageUrl = inlineMd[1].trim();
      }
    }
    imageUrl = questionImageUrl;

    // English extraction
    const engMatch = trimmed.match(/(?:English|En|ENG)\s*:\s*([^\n\r]+(?:\n(?!\s*(?:Telugu|Te|Image|Diagram|Figure|Fig|Img|చిత్రం|A|B|C|D|Answer|Exam|Date|Shift|Solution|Difficulty|Topic|\(a\)|\(1\)))[^\n\r]+)*)/i);
    if (engMatch) {
      english = engMatch[1].trim();
    } else {
      // If no explicit "English:", check the lines before Options
      const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // skip question label line if present
      let startIndex = 0;
      if (/^(?:Q\.?\s*\d+|Question\s+\d+|\d+\.)/i.test(lines[0])) {
        startIndex = 1;
      }
      if (lines[startIndex] && !/^(?:Telugu|Image|Diagram|Figure|Fig|Img|చిత్రం|A[:\)]|\(a\))/i.test(lines[startIndex])) {
        english = lines[startIndex].replace(/^(?:English|En):\s*/i, '');
      }
    }

    // Telugu extraction
    const telMatch = trimmed.match(/(?:Telugu|Te|TEL)\s*:\s*([^\n\r]+(?:\n(?!\s*(?:English|Image|Diagram|Figure|Fig|Img|చిత్రం|A|B|C|D|Answer|Exam|Date|Shift|Solution|Difficulty|Topic|\(a\)|\(1\)))[^\n\r]+)*)/i);
    if (telMatch) {
      telugu = telMatch[1].trim();
    } else {
      // Check if any line contains Telugu Unicode characters
      const lines = trimmed.split(/\r?\n/);
      for (const line of lines) {
        if (/[\u0C00-\u0C7F]/.test(line) && !/^(?:Telugu|Te|చిత్రం):/i.test(line)) {
          telugu = line.trim();
          break;
        }
      }
    }

    // Option A
    const aMatch = trimmed.match(/(?:^|\r?\n|\t|[|])\s*(?:(?:Option\s*A|\(a\)|\(1\)|1\))\s*[:.]?|A\s*[:.)])\s*([^\n\r]+)/i);
    if (aMatch) optA = aMatch[1].trim();

    // Option B
    const bMatch = trimmed.match(/(?:^|\r?\n|\t|[|])\s*(?:(?:Option\s*B|\(b\)|\(2\)|2\))\s*[:.]?|B\s*[:.)])\s*([^\n\r]+)/i);
    if (bMatch) optB = bMatch[1].trim();

    // Option C
    const cMatch = trimmed.match(/(?:^|\r?\n|\t|[|])\s*(?:(?:Option\s*C|\(c\)|\(3\)|3\))\s*[:.]?|C\s*[:.)])\s*([^\n\r]+)/i);
    if (cMatch) optC = cMatch[1].trim();

    // Option D
    const dMatch = trimmed.match(/(?:^|\r?\n|\t|[|])\s*(?:(?:Option\s*D|\(d\)|\(4\)|4\))\s*[:.]?|D\s*[:.)])\s*([^\n\r]+)/i);
    if (dMatch) optD = dMatch[1].trim();

    // Answer
    const ansMatch = trimmed.match(/(?:Answer|Ans|Correct\s*Answer)\s*[:.]\s*(?:Option\s*)?[\(\[]?\s*([A-D1-4])/i);
    if (ansMatch) {
      const aVal = ansMatch[1].toUpperCase();
      if (aVal === '1') answer = 'A';
      else if (aVal === '2') answer = 'B';
      else if (aVal === '3') answer = 'C';
      else if (aVal === '4') answer = 'D';
      else answer = aVal;
    }

    // Exam Name
    const examMatch = trimmed.match(/Exam\s*:\s*([^\n\r]+)/i);
    if (examMatch) examName = examMatch[1].trim();

    // Exam Date
    const dateMatch = trimmed.match(/Date\s*:\s*([^\n\r]+)/i);
    if (dateMatch) {
      const rawD = dateMatch[1].trim();
      // convert DD/MM/YYYY to YYYY-MM-DD if needed
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawD)) {
        const [d, m, y] = rawD.split('/');
        examDate = `${y}-${m}-${d}`;
      } else {
        examDate = rawD;
      }
    }

    // Shift
    const shiftMatch = trimmed.match(/Shift\s*:\s*([^\n\r]+)/i);
    if (shiftMatch) shift = shiftMatch[1].trim();

    // Solution / Explanation
    let solutionImageUrl = '';
    const solMatch = trimmed.match(/(?:(?:Detailed\s+)?(?:Solution|Explanation)|Ans(?:wer)?\s*Explanation|Sol\b|Exp\b|వివరణ|పరిష్కారం)\s*[:.-]?\s*([\s\S]+?)(?=(?:\r?\n\s*(?:Difficulty|Topic|Exam|Date|Shift|English|Telugu|Option|[A-D][:.]|Answer|Ans)\s*[:.]|$))/i);
    if (solMatch && solMatch[1]) {
      let extracted = solMatch[1].trim();
      // Remove trailing unmatched closing parenthesis if any
      if (extracted.endsWith(')') && !extracted.includes('(')) {
        extracted = extracted.slice(0, -1).trim();
      }
      solution = extracted;
    } else {
      // Check for inline explanation following Answer, e.g. Answer: B (Explanation: ...) or Answer: B - ...
      const inlineAnsMatch = trimmed.match(/(?:Answer|Ans|Correct\s*Answer)\s*[:.]\s*(?:Option\s*)?[\(\[]?\s*[A-D1-4][\)\]]?\s*[\(\[\-–—:,]\s*(?:(?:Detailed\s+)?(?:Solution|Explanation)|Ans(?:wer)?\s*Explanation|Sol\b|Exp\b|వివరణ|పరిష్కారం)?\s*[:.-]?\s*([^\n\r]+)/i);
      if (inlineAnsMatch && inlineAnsMatch[1]) {
        let extracted = inlineAnsMatch[1].trim();
        if (extracted.endsWith(')') && !extracted.includes('(')) {
          extracted = extracted.slice(0, -1).trim();
        }
        solution = extracted;
      } else {
        // Fallback: Check if there are lines following Answer that aren't other metadata
        const ansIndex = trimmed.search(/(?:Answer|Ans|Correct\s*Answer)\s*[:.]/i);
        if (ansIndex !== -1) {
          const afterAns = trimmed.substring(ansIndex);
          const lines = afterAns.split(/\r?\n/).slice(1);
          const solLines = [];
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            if (/^(?:Exam|Date|Shift|Difficulty|Topic|Chapter|English|Telugu|Option|[A-D][:.]|Q\.?\s*\d+)\s*[:.]/i.test(trimmedLine)) {
              break;
            }
            solLines.push(trimmedLine);
          }
          if (solLines.length > 0) {
            solution = solLines.join('\n').trim();
          }
        }
      }
    }

    // Extract Solution Image if present in solution section
    if (solution) {
      const solImgMatch = solution.match(/(?:^|\r?\n)\s*(?:Solution\s*(?:Image|Diagram|Figure|Fig|Img|చిత్రం)|Image|Diagram|Figure|Fig|Img|చిత్రం)\s*[:.]?\s*(?:\r?\n\s*)?([^\n\r]+)/i);
      if (solImgMatch && solImgMatch[1]) {
        const rawSolImg = solImgMatch[1].trim();
        const mdMatch = rawSolImg.match(/!\[.*?\]\((.*?)\)/);
        if (mdMatch) {
          solutionImageUrl = mdMatch[1].trim();
        } else {
          const htmlMatch = rawSolImg.match(/src=["'](.*?)["']/);
          if (htmlMatch) {
            solutionImageUrl = htmlMatch[1].trim();
          } else {
            solutionImageUrl = rawSolImg.replace(/^['"<]+|['">]+$/g, '').trim();
          }
        }
        // Remove the Image tag line from solution text so it doesn't render twice
        solution = solution.replace(solImgMatch[0], '').trim();
      } else {
        const mdSolMatch = solution.match(/!\[.*?\]\((.*?)\)/);
        if (mdSolMatch) {
          solutionImageUrl = mdSolMatch[1].trim();
          solution = solution.replace(mdSolMatch[0], '').trim();
        }
      }
    }

    // Difficulty
    const diffMatch = trimmed.match(/Difficulty\s*:\s*(Easy|Medium|Hard)/i);
    if (diffMatch) difficulty = diffMatch[1].trim();

    // Subtopic
    const topicMatch = trimmed.match(/Topic\s*:\s*([^\n\r]+)/i);
    if (topicMatch) topic = topicMatch[1].trim();

    if (!english && !telugu) {
      errors.push(`Question #${questionIndex}: Missing question text`);
      continue;
    }

    if (!optA || !optB || !optC || !optD) {
      errors.push(`Question #${questionIndex}: Missing some options (found A: "${optA}", B: "${optB}", C: "${optC}", D: "${optD}")`);
    }

    parsedQuestions.push({
      id: `bulk-${Date.now()}-${questionIndex}`,
      chapterId: blockChapterId,
      questionNumber: questionIndex,
      englishQuestion: english,
      teluguQuestion: telugu,
      imageUrl: imageUrl || '',
      solutionImageUrl: solutionImageUrl || '',
      optionA: optA || 'Option A',
      optionB: optB || 'Option B',
      optionC: optC || 'Option C',
      optionD: optD || 'Option D',
      correctAnswer: answer,
      examName,
      examDate,
      shift,
      difficulty,
      topic,
      solution,
      createdAt: new Date().toISOString()
    });
  }

  return { questions: parsedQuestions, errors };
};
