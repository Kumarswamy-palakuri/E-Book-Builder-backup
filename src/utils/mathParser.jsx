import React from 'react';
import katex from 'katex';

/**
 * Safely render a LaTeX math string to HTML using KaTeX.
 * Displays fractions in crisp, large display style with proper horizontal fraction bars.
 */
export const renderLatexSafe = (latexStr, isDisplayMode = false) => {
  try {
    let cleanLatex = (latexStr || '').trim();
    // If the expression contains fractions, render them in display style for crisp, clear presentation like in printed textbooks
    if (!isDisplayMode && /\\(?:d?frac)\b/.test(cleanLatex) && !cleanLatex.startsWith('\\displaystyle') && !cleanLatex.startsWith('\\textstyle')) {
      cleanLatex = `\\displaystyle ${cleanLatex}`;
    }
    return katex.renderToString(cleanLatex, {
      displayMode: isDisplayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false
    });
  } catch (e) {
    return `<span class="math-fallback">${latexStr}</span>`;
  }
};

/**
 * Helper to check whether a text or question object contains fractions or math expressions
 */
export const hasFractionsOrMath = (target) => {
  if (!target) return false;
  let text = '';
  if (typeof target === 'string') {
    text = target;
  } else if (typeof target === 'object') {
    text = [
      target.englishQuestion,
      target.teluguQuestion,
      target.optionA,
      target.optionB,
      target.optionC,
      target.optionD,
      target.solution
    ].filter(Boolean).join(' ');
  }

  return (
    /\$|\$\$|\\\(|\\\[|\\frac|\\sqrt|\\angle|\\triangle|\\sin|\\cos|\\tan|\\cot|\\sec|\\csc|\\theta|\\pi|\\circ|\^|\/|√|∠|△|∆|±|×|÷|≠|≤|≥/.test(text)
  );
};

/**
 * Normalize all LaTeX math delimiters:
 * - \[ ... \] -> $$ ... $$
 * - \( ... \) -> $ ... $
 * - Bare \frac{...}{...} outside $ -> $ \frac{...}{...} $
 */
export const normalizeMathDelimiters = (text = '') => {
  if (!text || typeof text !== 'string') return '';
  let res = text;
  // 1. Replace LaTeX display math \[ ... \] with $$ ... $$
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, (m, p) => `$$ ${p.trim()} $$`);
  // 2. Replace LaTeX inline math \( ... \) with $ ... $
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, (m, p) => `$ ${p.trim()} $`);

  // 3. Wrap bare \frac{...}{...} that are not already inside $...$ or $$...$$
  const parts = res.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  res = parts
    .map((part) => {
      if (part.startsWith('$')) return part;
      return part.replace(
        /\\(?:d?frac)\s*(\{(?:[^{}]*|\{[^{}]*\})*\})\s*(\{(?:[^{}]*|\{[^{}]*\})*\})/g,
        (m) => `$ ${m} $`
      );
    })
    .join('');

  return res;
};

/**
 * Convert plain text fractions and mathematical terminology into clean LaTeX format
 */
export const convertMathAndFractions = (text = '') => {
  if (!text || typeof text !== 'string') return '';

  // 0. Normalize LaTeX delimiters: \( ... \), \[ ... \], and bare \frac
  const normalizedText = normalizeMathDelimiters(text);

  // Preserve existing $...$ and $$...$$ blocks
  const parts = normalizedText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|!\[[^\]]*\]\([^)]+\))/g);

  return parts
    .map((part) => {
      // If already LaTeX math or markdown image, leave untouched
      if (
        (part.startsWith('$') && part.endsWith('$')) ||
        (part.startsWith('$$') && part.endsWith('$$')) ||
        part.startsWith('![')
      ) {
        return part;
      }

      let res = part;

      // 1. Temporarily shelter dates (e.g. 01/12/2025, 2026/03/09, 15-01-2026), data URIs, and URLs
      const shelteredDataUris = [];
      const shelteredDates = [];
      const shelteredUrls = [];

      res = res.replace(/data:image\/[a-zA-Z0-9+.\-]+;base64,[^\s<>'"]+/g, (match) => {
        shelteredDataUris.push(match);
        return `___SHELTERED_DATA_URI_${shelteredDataUris.length - 1}___`;
      });
      res = res.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, (match) => {
        shelteredDates.push(match);
        return `___SHELTERED_DATE_${shelteredDates.length - 1}___`;
      });
      res = res.replace(/https?:\/\/[^\s)]+|\/[a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+/g, (match) => {
        shelteredUrls.push(match);
        return `___SHELTERED_URL_${shelteredUrls.length - 1}___`;
      });

      // 2. Convert Mixed Fractions (e.g. 16 2/3%, 33 1/3%, 3 1/2)
      res = res.replace(
        /\b(\d+)\s+([0-9]+)\s*\/\s*([0-9]+)\s*(%?)(?!\w)/g,
        (m, whole, num, den, pct) => {
          return `$ ${whole}\\frac{${num}}{${den}}${pct ? '\\%' : ''} $`;
        }
      );

      // 3. Convert Standard Numerical Fractions (e.g. 1/2, 3/4, 20/100, 180/300)
      // Exclude matches that look like years or phone numbers
      res = res.replace(
        /(?<![a-zA-Z0-9_\.\/])(\d{1,4})\s*\/\s*(\d{1,4})(%?)(?![a-zA-Z0-9_\.\/])/g,
        (m, num, den, pct) => {
          // If 4-digit number > 1900, might be year fraction, but usually fractions have small numbers or 100/1000
          if ((num.length === 4 && Number(num) > 1900 && Number(den) <= 12) || (den.length === 4 && Number(den) > 1900 && Number(num) <= 12)) {
            return m; // Likely date-like
          }
          return `$ \\frac{${num}}{${den}}${pct ? '\\%' : ''} $`;
        }
      );

      // 4. Convert Algebraic Fractions (e.g. a/b, x/y, (x+1)/(x-1))
      res = res.replace(
        /\(([a-zA-Z0-9\s+\-*]+)\)\s*\/\s*\(([a-zA-Z0-9\s+\-*]+)\)/g,
        (m, num, den) => `$ \\frac{${num.trim()}}{${den.trim()}} $`
      );
      res = res.replace(
        /(?<![a-zA-Z0-9_])([a-zA-Z])\s*\/\s*([a-zA-Z])(?![a-zA-Z0-9_])/g,
        (m, num, den) => `$ \\frac{${num}}{${den}} $`
      );

      // 5. Convert Geometric and Trigonometric terminology
      // Triangles: triangle ABC, △ABC, ∆ABC
      res = res.replace(/\b(?:triangle|\\triangle|[△∆])\s*([A-Z]{2,4})\b/gi, (m, letters) => {
        return `$ \\triangle \\text{${letters}} $`;
      });

      // Angles: angle ABC, ∠ABC
      res = res.replace(/\b(?:angle|\\angle|[∠])\s*([A-Z]{1,4})\b/gi, (m, letters) => {
        return `$ \\angle \\text{${letters}} $`;
      });

      // Degrees: 45 degrees, 90 deg, 160°
      res = res.replace(/\b(\d+(?:\.\d+)?)\s*(?:degrees|degree|deg)\b/gi, (m, deg) => {
        return `$ ${deg}^\\circ $`;
      });
      res = res.replace(/\b(\d+(?:\.\d+)?)°/g, (m, deg) => {
        return `$ ${deg}^\\circ $`;
      });

      // Square roots: sqrt(16), √16, √x
      res = res.replace(/\bsqrt\s*\(\s*([^)]+)\s*\)/gi, (m, inner) => {
        return `$ \\sqrt{${inner.trim()}} $`;
      });
      res = res.replace(/[√]\s*([0-9a-zA-Z]+|\([^)]+\))/g, (m, inner) => {
        const clean = inner.replace(/^\(|\)$/g, '');
        return `$ \\sqrt{${clean}} $`;
      });

      // Powers and units: cm^2, m^3, cm², m³
      res = res.replace(/\b(cm|m|km|mm|ft|in)\^2\b|\b(cm|m|km|mm|ft|in)²\b/gi, (m, unit) => {
        return `$ \\text{${unit || 'cm'}}^2 $`;
      });
      res = res.replace(/\b(cm|m|km|mm|ft|in)\^3\b|\b(cm|m|km|mm|ft|in)³\b/gi, (m, unit) => {
        return `$ \\text{${unit || 'cm'}}^3 $`;
      });

      // Simple variable exponents: x^2, y^3, r^2
      res = res.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z])\^([0-9]+)(?![a-zA-Z0-9_\$])/g, (m, v, p) => {
        return `$ ${v}^{${p}} $`;
      });

      // Common symbols
      res = res.replace(/\bpi\b(?!\w)/gi, '$ \\pi $');
      res = res.replace(/\btheta\b(?!\w)/gi, '$ \\theta $');
      res = res.replace(/\balpha\b(?!\w)/gi, '$ \\alpha $');
      res = res.replace(/\bbeta\b(?!\w)/gi, '$ \\beta $');

      // 6. Restore sheltered data URIs, dates, and URLs
      shelteredDataUris.forEach((val, idx) => {
        res = res.replace(`___SHELTERED_DATA_URI_${idx}___`, val);
      });
      shelteredDates.forEach((val, idx) => {
        res = res.replace(`___SHELTERED_DATE_${idx}___`, val);
      });
      shelteredUrls.forEach((val, idx) => {
        res = res.replace(`___SHELTERED_URL_${idx}___`, val);
      });

      return res;
    })
    .join('');
};

/**
 * Helper to render text with any Telugu character segments wrapped in font-telugu (bold and red)
 */
const renderTextWithTelugu = (str, keyPrefix) => {
  if (!str) return null;
  if (!/[\u0C00-\u0C7F]/.test(str)) {
    return <span key={keyPrefix}>{str}</span>;
  }

  // Matches Telugu Unicode range including combining marks and spaces between Telugu words
  const segments = str.split(/([\u0C00-\u0C7F]+(?:[\s\u200C\u200D]+[\u0C00-\u0C7F]+)*)/g);
  return (
    <span key={keyPrefix}>
      {segments.map((seg, sIdx) => {
        if (/[\u0C00-\u0C7F]/.test(seg)) {
          return (
            <span key={`${keyPrefix}-${sIdx}`} className="font-telugu">
              {seg}
            </span>
          );
        }
        return <span key={`${keyPrefix}-${sIdx}`}>{seg}</span>;
      })}
    </span>
  );
};

/**
 * Tokenizer to split text and embedded images (data URIs, Image: prefixes, markdown, html, URLs)
 */
export const EMBEDDED_IMAGE_REGEX = /(?:(?:^|\r?\n)\s*)?(?:(?:Image|Diagram|Figure|Fig|Img|చిత్రం)\s*[:.]?\s*(?:\r?\n\s*)?)?(?:!\[([^\]]*)\]\(([^)]+)\)|<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>|(data:image\/[a-zA-Z0-9+.\-]+;base64,[^\s<>'"]+)|(https?:\/\/[^\s<>'"]+?\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s<>'"]*)?))|(?:(?:^|\r?\n)\s*)?(?:Image|Diagram|Figure|Fig|Img|చిత్రం)\s*[:.]?\s*(?:\r?\n\s*)?(https?:\/\/[^\s<>'"]+)/gi;

export const parseContentAndImages = (text = '') => {
  if (!text || typeof text !== 'string') return [];
  const parts = [];
  let lastIdx = 0;
  let match;
  const regex = new RegExp(EMBEDDED_IMAGE_REGEX.source, 'gi');

  while ((match = regex.exec(text)) !== null) {
    const textBefore = text.substring(lastIdx, match.index);
    if (textBefore.trim()) {
      parts.push({ type: 'text', content: textBefore });
    }
    const src = match[2] || match[3] || match[4] || match[5] || match[6];
    if (src) {
      parts.push({ type: 'image', src: src.trim() });
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) {
    const remaining = text.substring(lastIdx);
    if (remaining.trim()) {
      parts.push({ type: 'text', content: remaining });
    }
  }
  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
};

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
 * Internal renderer for pure math/text
 */
const MathRendererText = ({ text = '', className = '', inline = true }) => {
  if (!text) return null;

  // Convert plain-text fractions and mathematical terminology into LaTeX expressions
  const formattedText = convertMathAndFractions(text);

  // Split by double dollar $$...$$ or single dollar $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = formattedText.split(regex);

  const geomLatexRegex = /\\(frac|sqrt|sin|cos|tan|pi|pm|times|div|le|ge|neq|theta|alpha|beta|Delta|Sigma|circ|triangle|odot|bigcirc|angle|perp|sim|cong)/;

  return (
    <span className={`math-rendered-content ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          const html = renderLatexSafe(math, true);
          return (
            <span
              key={index}
              className="katex-block my-1.5 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          const html = renderLatexSafe(math, false);
          return (
            <span
              key={index}
              className="katex-inline inline-block mx-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        const hasLatex = geomLatexRegex.test(part);
        const hasTelugu = /[\u0C00-\u0C7F]/.test(part);

        // If the part contains both raw LaTeX macros and Telugu text
        if (hasLatex && hasTelugu) {
          const subParts = part.split(/([\u0C00-\u0C7F]+(?:[\s\u200C\u200D.,:;?!()\-–—]+[\u0C00-\u0C7F]+)*)/g);
          return (
            <span key={index}>
              {subParts.map((sub, sIdx) => {
                if (/[\u0C00-\u0C7F]/.test(sub)) {
                  return (
                    <span key={sIdx} className="font-telugu">
                      {sub}
                    </span>
                  );
                }
                if (geomLatexRegex.test(sub)) {
                  const html = renderLatexSafe(sub, false);
                  return (
                    <span
                      key={sIdx}
                      className="katex-inline inline-block mx-0.5"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                }
                return <span key={sIdx}>{sub}</span>;
              })}
            </span>
          );
        }

        // If the part contains raw LaTeX macros without $, like \frac{a}{b} or \sqrt{x}
        if (hasLatex) {
          const html = renderLatexSafe(part, false);
          return (
            <span
              key={index}
              className="katex-inline inline-block mx-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // Standard text
        return renderTextWithTelugu(part, index);
      })}
    </span>
  );
};

/**
 * Component that parses mixed text containing $...$ or $$...$$ or raw LaTeX macros (\frac, \sqrt, \sin, etc.)
 * Automatically detects fractions and mathematical terminology to format them crisply with KaTeX.
 * Also automatically detects embedded images (Base64 data URIs, Image: prefixes, Markdown, HTML)
 * and renders them with a neat small border and NO figure name.
 */
export const MathRenderer = ({ text = '', className = '', inline = true }) => {
  if (!text) return null;

  const segments = parseContentAndImages(text);
  if (segments.length > 1 || (segments.length === 1 && segments[0].type === 'image')) {
    return (
      <span className={`math-rendered-content ${className}`}>
        {segments.map((seg, sIdx) => {
          if (seg.type === 'image') {
            return (
              <span
                key={`img-${sIdx}`}
                className="text-feature-image inline-flex max-w-full overflow-hidden align-middle m-0 p-0 border-0 bg-transparent diagram-container"
                style={{ margin: '4px 0', padding: 0, border: 'none', background: 'transparent', maxWidth: '100%' }}
              >
                <img
                  src={seg.src}
                  alt=""
                  className="text-feature-img max-h-48 max-w-full w-auto h-auto object-contain m-0 p-0 border-0 bg-transparent align-middle block"
                  style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                />
              </span>
            );
          }
          return <MathRendererText key={`sub-${sIdx}`} text={seg.content} className={className} inline={inline} />;
        })}
      </span>
    );
  }

  return <MathRendererText text={text} className={className} inline={inline} />;
};

export default MathRenderer;
