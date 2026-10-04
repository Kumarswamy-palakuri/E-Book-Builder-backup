import * as XLSX from 'xlsx';
import { parseContentAndImages, getCleanSolutionText } from './mathParser';

/**
 * Export questions array to Microsoft Word (.docx) document
 * Places pictures beside questions as a side element in a 2-column layout
 */
export const exportQuestionsToWord = async (questions, chapters, filename = 'MCQ_Questions.docx') => {
  const docx = await import('docx');
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    HeadingLevel,
    AlignmentType,
    VerticalAlign,
    ImageRun
  } = docx;

  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c.name]));

  const docChildren = [
    new Paragraph({
      text: 'BILINGUAL MCQ QUESTION BANK',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  ];

  // Helper to convert base64 image or fetch image to bytes
  const getImageBytes = async (imgSrc) => {
    try {
      if (!imgSrc) return null;
      if (imgSrc.startsWith('data:image/')) {
        const base64Data = imgSrc.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      const resp = await fetch(imgSrc);
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        return new Uint8Array(buffer);
      }
    } catch (e) {
      console.warn('Could not load image for Word export:', e);
    }
    return null;
  };

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];

    const leftColParagraphs = [
      new Paragraph({
        children: [
          new TextRun({ text: `Q${q.questionNumber || (idx + 1)}. `, bold: true, color: '1D4ED8' }),
          new TextRun({ text: q.englishQuestion || '', bold: true })
        ],
        spacing: { after: 100 }
      })
    ];

    if (q.teluguQuestion) {
      leftColParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: q.teluguQuestion, color: 'DC2626' })
          ],
          spacing: { after: 120 }
        })
      );
    }

    const optRows = [
      `(a) ${q.optionA || ''}`,
      `(b) ${q.optionB || ''}`,
      `(c) ${q.optionC || ''}`,
      `(d) ${q.optionD || ''}`
    ];
    optRows.forEach(optText => {
      leftColParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: optText, size: 20 })],
          spacing: { after: 60 }
        })
      );
    });

    if (q.correctAnswer) {
      leftColParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Answer: (${q.correctAnswer.toLowerCase()})`, bold: true, color: '059669' })
          ],
          spacing: { before: 80, after: 60 }
        })
      );
    }

    // Keep question table cell clean: only question, options, and answer badge (no solution content)

    // Check if question has an image to place beside the question as a side element
    const imgBytes = q.imageUrl ? await getImageBytes(q.imageUrl) : null;

    if (imgBytes) {
      // 2-column table: Left = Question & Options (70%), Right = Side Picture Element (30%)
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: leftColParagraphs
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
                },
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: imgBytes,
                        transformation: { width: 140, height: 110 }
                      })
                    ],
                    alignment: AlignmentType.CENTER
                  })
                ]
              })
            ]
          })
        ]
      });

      docChildren.push(table);
      docChildren.push(new Paragraph({ spacing: { after: 150 } }));
    } else {
      leftColParagraphs.forEach(p => docChildren.push(p));
      docChildren.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
        spacing: { after: 180 }
      }));
    }
  }

  // Dedicated Solutions & Explanations Section in Word Export
  const questionsWithSolutions = questions.filter(q => (q.solution && q.solution.trim()) || q.solutionImageUrl);
  if (questionsWithSolutions.length > 0) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'SOLUTIONS & EXPLANATIONS', bold: true, size: 28, color: '1D4ED8' })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      })
    );

    for (const q of questionsWithSolutions) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Question #${q.questionNumber || ''} `, bold: true, color: '1D4ED8' }),
            ...(q.correctAnswer ? [new TextRun({ text: `(Correct Option: ${q.correctAnswer.toLowerCase()})`, bold: true, color: '059669' })] : [])
          ],
          spacing: { before: 120, after: 60 }
        })
      );

      const cleanSol = getCleanSolutionText(q.solution, q.solutionImageUrl);
      if (cleanSol) {
        const solSegments = parseContentAndImages(cleanSol);
        for (const seg of solSegments) {
          if (seg.type === 'image') {
            const sImgBytes = await getImageBytes(seg.src);
            if (sImgBytes) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: sImgBytes,
                      transformation: { width: 220, height: 160 }
                    })
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 80, after: 80 }
                })
              );
            }
          } else if (seg.content && seg.content.trim()) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({ text: seg.content.trim(), italics: false, color: '374151' })
                ],
                spacing: { after: 80 }
              })
            );
          }
        }
      }

      if (q.solutionImageUrl) {
        const sImgBytes = await getImageBytes(q.solutionImageUrl);
        if (sImgBytes) {
          docChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: sImgBytes,
                  transformation: { width: 220, height: 160 }
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 80 }
            })
          );
        }
      }

      docChildren.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' } },
          spacing: { after: 120 }
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export questions array to Excel workbook (.xlsx)
 */
export const exportQuestionsToExcel = (questions, chapters, filename = 'MCQ_Questions.xlsx') => {
  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c.name]));

  const rows = questions.map((q, idx) => ({
    'Sl No': idx + 1,
    'Chapter': chapterMap[q.chapterId] || 'Unknown',
    'Question No': q.questionNumber,
    'English Question': q.englishQuestion,
    'Telugu Question': q.teluguQuestion,
    'Option A': q.optionA,
    'Option B': q.optionB,
    'Option C': q.optionC,
    'Option D': q.optionD,
    'Correct Answer': q.correctAnswer,
    'Exam Name': q.examName,
    'Exam Date': q.examDate,
    'Shift': q.shift,
    'Difficulty': q.difficulty,
    'Topic': q.topic,
    'Solution': q.solution,
    'Image': q.imageUrl || '',
    'Solution Image': q.solutionImageUrl || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

  XLSX.writeFile(workbook, filename);
};

/**
 * Export questions to CSV
 */
export const exportQuestionsToCSV = (questions, chapters, filename = 'MCQ_Questions.csv') => {
  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c.name]));

  const headers = [
    'Chapter', 'Question No', 'English Question', 'Telugu Question',
    'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer',
    'Exam Name', 'Exam Date', 'Shift', 'Difficulty', 'Topic', 'Solution', 'Image', 'Solution Image'
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [
    headers.join(','),
    ...questions.map(q => [
      escapeCSV(chapterMap[q.chapterId] || ''),
      q.questionNumber,
      escapeCSV(q.englishQuestion),
      escapeCSV(q.teluguQuestion),
      escapeCSV(q.optionA),
      escapeCSV(q.optionB),
      escapeCSV(q.optionC),
      escapeCSV(q.optionD),
      escapeCSV(q.correctAnswer),
      escapeCSV(q.examName),
      escapeCSV(q.examDate),
      escapeCSV(q.shift),
      escapeCSV(q.difficulty),
      escapeCSV(q.topic),
      escapeCSV(q.solution),
      escapeCSV(q.imageUrl || ''),
      escapeCSV(q.solutionImageUrl || '')
    ].join(','))
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export full application backup (Questions + Chapters + Settings)
 */
export const exportBackupJSON = (questions, chapters, settings) => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings,
    chapters,
    questions
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Exam_Book_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

/**
 * Parse uploaded Excel or CSV file
 */
export const parseUploadedSpreadsheet = async (file, chapters) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(firstSheet);

        const chapterMap = {};
        chapters.forEach(c => {
          chapterMap[c.name.toLowerCase().trim()] = c.id;
          chapterMap[c.teluguName.toLowerCase().trim()] = c.id;
        });

        const parsed = [];
        const errors = [];

        jsonRows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const chapterName = (row['Chapter'] || row['chapter'] || '').toString().trim();
          const english = (row['English Question'] || row['English'] || row['Question'] || '').toString().trim();
          const telugu = (row['Telugu Question'] || row['Telugu'] || '').toString().trim();
          const optA = (row['Option A'] || row['OptionA'] || row['A'] || '').toString().trim();
          const optB = (row['Option B'] || row['OptionB'] || row['B'] || '').toString().trim();
          const optC = (row['Option C'] || row['OptionC'] || row['C'] || '').toString().trim();
          const optD = (row['Option D'] || row['OptionD'] || row['D'] || '').toString().trim();
          let ans = (row['Correct Answer'] || row['Answer'] || 'A').toString().trim().toUpperCase();
          if (ans === '1') ans = 'A';
          if (ans === '2') ans = 'B';
          if (ans === '3') ans = 'C';
          if (ans === '4') ans = 'D';

          if (!english && !telugu) {
            errors.push(`Row ${rowNum}: Missing question text`);
            return;
          }

          const matchedChapterId = chapterMap[chapterName.toLowerCase()] || chapters[0]?.id || 'ch-1';

          parsed.push({
            id: `import-${Date.now()}-${idx}`,
            chapterId: matchedChapterId,
            questionNumber: Number(row['Question No'] || row['Sl No']) || (idx + 1),
            englishQuestion: english,
            teluguQuestion: telugu,
            optionA: optA || 'Option A',
            optionB: optB || 'Option B',
            optionC: optC || 'Option C',
            optionD: optD || 'Option D',
            correctAnswer: ['A', 'B', 'C', 'D'].includes(ans) ? ans : 'A',
            examName: (row['Exam Name'] || row['Exam'] || 'Competitive Exam').toString().trim(),
            examDate: (row['Exam Date'] || row['Date'] || new Date().toISOString().split('T')[0]).toString().trim(),
            shift: (row['Shift'] || 'Shift-01').toString().trim(),
            difficulty: (row['Difficulty'] || 'Medium').toString().trim(),
            topic: (row['Topic'] || '').toString().trim(),
            solution: (row['Solution'] || row['Explanation'] || '').toString().trim(),
            imageUrl: (row['Image'] || row['ImageUrl'] || row['Question Image'] || row['Diagram'] || row['Figure'] || '').toString().trim(),
            solutionImageUrl: (row['Solution Image'] || row['SolutionImageUrl'] || row['Solution Diagram'] || '').toString().trim(),
            createdAt: new Date().toISOString()
          });
        });

        resolve({ questions: parsed, errors });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse uploaded Microsoft Word (.docx) file
 * Extracts embedded pictures and supports both Word Tables and Structured Text format with side pictures
 */
export const parseUploadedWordDocument = async (file, chapters, defaultChapterId = null) => {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  // Convert embedded images to base64 data URIs so they are preserved
  const mammothOptions = {
    convertImage: mammoth.images.imgElement((image) => {
      return image.read("base64").then((imageBuffer) => {
        return {
          src: `data:${image.contentType};base64,${imageBuffer}`
        };
      });
    })
  };

  const htmlRes = await mammoth.convertToHtml({ arrayBuffer, buffer: arrayBuffer }, mammothOptions);
  const rawTextRes = await mammoth.extractRawText({ arrayBuffer, buffer: arrayBuffer });

  const html = htmlRes.value || '';
  const rawText = rawTextRes.value || '';

  const chapterMap = {};
  chapters.forEach(c => {
    chapterMap[c.name.toLowerCase().trim()] = c.id;
    chapterMap[c.teluguName.toLowerCase().trim()] = c.id;
  });

  const parsed = [];
  const errors = [];

  // 1. Check for Word Tables (Excel-style columns or 2-column Q&A with side images)
  const tableMatches = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
  for (const tMatch of tableMatches) {
    const tableHtml = tMatch[1];
    const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    if (rowMatches.length < 2) continue;

    const rows = rowMatches.map(r => {
      const cellMatches = [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
      return cellMatches.map(c => {
        const rawCell = c[1];
        const imgMatch = rawCell.match(/<img[^>]+src=["']([^"']+)["']/i);
        const imgUrl = imgMatch ? imgMatch[1] : '';
        const textVal = rawCell.replace(/<[^>]+>/g, '').trim();
        return { text: textVal, image: imgUrl };
      });
    });

    const headerRow = rows[0].map(h => h.text.toLowerCase().trim());
    const getColIndex = (names) => headerRow.findIndex(h => names.some(n => h.includes(n)));

    const colChapter = getColIndex(['chapter']);
    const colQNo = getColIndex(['q no', 'question no', 'sl no', 'no']);
    const colEng = getColIndex(['english question', 'english', 'question']);
    const colTel = getColIndex(['telugu question', 'telugu']);
    const colA = getColIndex(['option a', 'optiona', 'a']);
    const colB = getColIndex(['option b', 'optionb', 'b']);
    const colC = getColIndex(['option c', 'optionc', 'c']);
    const colD = getColIndex(['option d', 'optiond', 'd']);
    const colAns = getColIndex(['correct answer', 'answer', 'ans']);
    const colExam = getColIndex(['exam name', 'exam']);
    const colDate = getColIndex(['exam date', 'date']);
    const colShift = getColIndex(['shift']);
    const colDiff = getColIndex(['difficulty']);
    const colTopic = getColIndex(['topic', 'subsection']);
    const colSol = getColIndex(['solution', 'explanation', 'sol', 'exp', 'వివరణ']);
    const colImg = getColIndex(['image', 'diagram', 'figure', 'fig', 'img', 'picture']);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || row.every(cell => !cell.text && !cell.image)) continue;

      const chapterVal = colChapter !== -1 && row[colChapter] ? row[colChapter].text : '';
      const english = colEng !== -1 && row[colEng] ? row[colEng].text : '';
      const telugu = colTel !== -1 && row[colTel] ? row[colTel].text : '';
      const optA = colA !== -1 && row[colA] ? row[colA].text : '';
      const optB = colB !== -1 && row[colB] ? row[colB].text : '';
      const optC = colC !== -1 && row[colC] ? row[colC].text : '';
      const colDVal = colD !== -1 && row[colD] ? row[colD].text : '';
      let ans = (colAns !== -1 && row[colAns] ? row[colAns].text : 'A').toUpperCase().trim();
      if (ans === '1') ans = 'A';
      if (ans === '2') ans = 'B';
      if (ans === '3') ans = 'C';
      if (ans === '4') ans = 'D';

      if (!english && !telugu) continue;

      // Extract image: question image from colImg or question cells, solution image from solution cell
      let foundImg = '';
      if (colImg !== -1 && row[colImg]) {
        foundImg = row[colImg].image || row[colImg].text;
      }
      if (!foundImg) {
        const questionCells = [
          colEng !== -1 ? row[colEng] : null,
          colTel !== -1 ? row[colTel] : null
        ].filter(Boolean);
        const anyQImgCell = questionCells.find(c => c.image);
        if (anyQImgCell) foundImg = anyQImgCell.image;
      }

      let foundSolImg = '';
      if (colSol !== -1 && row[colSol] && row[colSol].image) {
        foundSolImg = row[colSol].image;
      }

      const matchedChapterId = (chapterVal && chapterMap[chapterVal.toLowerCase()]) || defaultChapterId || chapters[0]?.id || 'ch-1';

      parsed.push({
        id: `word-tbl-${Date.now()}-${parsed.length}`,
        chapterId: matchedChapterId,
        questionNumber: (colQNo !== -1 && Number(row[colQNo]?.text)) || (parsed.length + 1),
        englishQuestion: english,
        teluguQuestion: telugu,
        optionA: optA || 'Option A',
        optionB: optB || 'Option B',
        optionC: optC || 'Option C',
        optionD: colDVal || 'Option D',
        correctAnswer: ['A', 'B', 'C', 'D'].includes(ans) ? ans : 'A',
        examName: colExam !== -1 && row[colExam]?.text ? row[colExam].text : 'Competitive Exam',
        examDate: colDate !== -1 && row[colDate]?.text ? row[colDate].text : new Date().toISOString().split('T')[0],
        shift: colShift !== -1 && row[colShift]?.text ? row[colShift].text : 'Shift-01',
        difficulty: colDiff !== -1 && row[colDiff]?.text ? row[colDiff].text : 'Medium',
        topic: colTopic !== -1 && row[colTopic]?.text ? row[colTopic].text : '',
        solution: colSol !== -1 && row[colSol]?.text ? row[colSol].text : '',
        imageUrl: foundImg || '',
        solutionImageUrl: foundSolImg || '',
        createdAt: new Date().toISOString()
      });
    }
  }

  // 2. Also parse structured text from Word (preserving images embedded beside or inside questions)
  if (html.trim()) {
    // Convert HTML images to Image: tags and line breaks
    let convertedText = html
      .replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, '\nImage: $1\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<[^>]+>/g, ' ');

    const { parseStructuredBulkText } = await import('./bulkTextParser');
    const textParsed = parseStructuredBulkText(convertedText, chapters, defaultChapterId);

    if (parsed.length === 0) {
      parsed.push(...textParsed.questions);
      errors.push(...textParsed.errors);
    } else {
      // Append text questions that aren't duplicates
      const existingEng = new Set(parsed.map(q => q.englishQuestion.toLowerCase().trim()));
      textParsed.questions.forEach(tq => {
        if (!existingEng.has(tq.englishQuestion.toLowerCase().trim())) {
          parsed.push(tq);
        }
      });
    }
  }

  if (parsed.length === 0) {
    errors.push('No questions found in Word document. Please ensure it has a question table or Q1: English: ... format.');
  }

  return { questions: parsed, errors };
};
