import React, { useState, useRef } from 'react';
import {
  FileText,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  HelpCircle,
  Copy,
  Sparkles,
  ArrowRight,
  Database,
  Languages,
  RefreshCw,
  Sliders,
  Wand2,
  Loader2,
  FileCheck,
  FileUp,
  X,
  Layers,
  FolderOpen,
  FileCode,
  Tag,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { parseStructuredBulkText, detectChapterFromFilename } from '../utils/bulkTextParser';
import {
  parseUploadedWordDocument,
  exportQuestionsToWord
} from '../utils/exportImport';
import {
  processImportedQuestionsTelugu,
  cleanAndRespaceTelugu,
  translateEnglishToTelugu
} from '../utils/translator';
import MathRenderer from '../utils/mathParser';

const SAMPLE_TEXT_TEMPLATE = `Chapter: Percentage

Q1:
English: What is 20% of 500?
Telugu: 500 లో 20% ఎంత?
A: 50
B: 100
C: 150
D: 200
Answer: B
Exam: RRB Group D
Date: 01/12/2025
Shift: 01
Difficulty: Easy
Solution: 20% of 500 = (20/100) * 500 = 100.

Q2:
English: A student scored 180 marks out of 300. What is his percentage?
Telugu: ఒక విద్యార్థి 300 మార్కులకు గాను 180 మార్కులు పొందాడు. అతని శాతం ఎంత?
A: 50%
B: 55%
C: 60%
D: 65%
Answer: C
Exam: RRB NTPC
Date: 15/01/2026
Shift: 02
Difficulty: Easy
Solution: Percentage = (180 / 300) * 100 = 60%.

Q3:
English: In the given figure, $O$ is the centre of the circle and $\triangle ABC$ is inscribed in it. If $\angle BOC = 160^\circ$, find $\angle BAC$.
Telugu: ఇచ్చిన చిత్రంలో $O$ వృత్త కేంద్రం మరియు అందులో $\triangle ABC$ అంతర్లిఖితమై ఉంది. $\angle BOC = 160^\circ$ అయితే, $\angle BAC$ విలువ ఎంత?
Image: /diagrams/triangle_in_circle.svg
A: 70°
B: 80°
C: 85°
D: 90°
Answer: B
Exam: RRB Technician
Date: 11/02/2026
Shift: 01
Difficulty: Medium
Solution: In a circle with centre $O$, the angle subtended by an arc at the circumference is half the angle subtended at the centre. $\angle BAC = \frac{1}{2} \angle BOC = \frac{160^\circ}{2} = 80^\circ$.`;

const BulkImportTab = ({
  chapters,
  onImportQuestions,
  onNavigateToBank
}) => {
  const [activeMode, setActiveMode] = useState('text'); // 'text' | 'file'
  const [rawText, setRawText] = useState(SAMPLE_TEXT_TEMPLATE);
  const [selectedDefaultChapter, setSelectedDefaultChapter] = useState(chapters[0]?.id || 'ch-1');
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [autoTranslateTelugu, setAutoTranslateTelugu] = useState(true);
  const [importSuccessCount, setImportSuccessCount] = useState(null);

  // Drag & drop and loaded file state
  const [isDraggingTxt, setIsDraggingTxt] = useState(false);
  const [isDraggingTextarea, setIsDraggingTextarea] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [loadedFileInfo, setLoadedFileInfo] = useState(null);
  const [batchFilesSummary, setBatchFilesSummary] = useState(null);

  // Preview filtering
  const [previewChapterFilter, setPreviewChapterFilter] = useState('all');
  const [previewFileFilter, setPreviewFileFilter] = useState('all');

  const txtFileInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Trigger parsing of raw structured text / JSON
  const parseAndPreviewText = async (textToParse = rawText, targetChapId = null, sourceFileName = null) => {
    setIsProcessing(true);
    setProcessingStatus('Parsing input format (Structured text / JSON)...');
    setImportSuccessCount(null);
    try {
      let questions = [];
      let errors = [];
      const trimmed = textToParse.trim();
      const defaultChap = targetChapId || selectedDefaultChapter;

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          const rawItems = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
          questions = rawItems.map((item, idx) => ({
            id: item.id || `q-import-${Date.now()}-${idx + 1}`,
            chapterId: item.chapterId || defaultChap,
            bookId: item.bookId || 'book-1',
            questionNumber: item.questionNumber || (idx + 1),
            englishQuestion: item.englishQuestion || item.question || '',
            teluguQuestion: item.teluguQuestion || '',
            imageUrl: item.imageUrl || item.questionImage || item.diagram || item.figure || '',
            solutionImageUrl: item.solutionImageUrl || item.solutionImage || '',
            optionA: item.optionA || '',
            optionB: item.optionB || '',
            optionC: item.optionC || '',
            optionD: item.optionD || '',
            correctAnswer: (item.correctAnswer || item.answer || 'A').toUpperCase(),
            examName: item.examName || '',
            examDate: item.examDate || '',
            shift: item.shift || '',
            difficulty: item.difficulty || 'Medium',
            topic: item.topic || '',
            solution: item.solution || item.explanation || item.sol || item.exp || '',
            createdAt: item.createdAt || new Date().toISOString(),
            _sourceFile: sourceFileName || 'Direct Text / JSON'
          }));
        } catch (jsonErr) {
          errors.push(`JSON Parse Error: ${jsonErr.message}`);
        }
      } else {
        const parsedResult = parseStructuredBulkText(textToParse, chapters, defaultChap);
        questions = parsedResult.questions.map(q => ({
          ...q,
          _sourceFile: sourceFileName || 'Direct Structured Text'
        }));
        errors = parsedResult.errors;
      }

      // Fallback default chapter if none detected in text
      const withChapter = questions.map(q => ({
        ...q,
        chapterId: q.chapterId || defaultChap
      }));

      let finalQuestions = withChapter;
      if (autoTranslateTelugu && finalQuestions.length > 0) {
        setProcessingStatus('Auto-translating missing Telugu & formatting questions...');
        finalQuestions = await processImportedQuestionsTelugu(withChapter, (curr, tot) => {
          setProcessingStatus(`Translating & formatting Telugu: ${curr} of ${tot}...`);
        }, false);
      }

      setPreviewQuestions(finalQuestions);
      setParseErrors(errors);
    } catch (err) {
      setParseErrors([err.message || 'Failed to parse text']);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleParseText = () => {
    return parseAndPreviewText(rawText, selectedDefaultChapter);
  };

  // Handle one or multiple files in bulk with auto-detected chapters based on filename
  const handleProcessFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;

    const validFiles = Array.from(filesList);
    setImportSuccessCount(null);
    setParseErrors([]);
    setIsProcessing(true);

    // Case 1: Single file uploaded
    if (validFiles.length === 1) {
      const file = validFiles[0];
      const lowerName = file.name.toLowerCase();
      setProcessingStatus(`Auto-detecting chapter & reading ${file.name}...`);
      setBatchFilesSummary(null);

      try {
        // Auto-detect chapter from filename
        let targetChapterId = selectedDefaultChapter;
        const detected = detectChapterFromFilename(file.name, chapters);
        if (detected) {
          targetChapterId = detected.id;
          setSelectedDefaultChapter(detected.id);
        }

        if (lowerName.endsWith('.txt') || file.type === 'text/plain') {
          const text = await file.text();
          const lineCount = text.split(/\r?\n/).length;

          // If not detected by filename, check Chapter: header inside text
          if (!detected) {
            const chapterMatch = text.match(/Chapter\s*:\s*([^\n\r]+)/i);
            if (chapterMatch && chapterMatch[1]) {
              const chapterName = chapterMatch[1].trim().toLowerCase();
              const found = chapters.find(
                c => c.name.toLowerCase() === chapterName ||
                  c.teluguName?.toLowerCase() === chapterName ||
                  chapterName.includes(c.name.toLowerCase())
              );
              if (found) {
                targetChapterId = found.id;
                setSelectedDefaultChapter(found.id);
              }
            }
          }

          const chapObj = chapters.find(c => c.id === targetChapterId);
          setLoadedFileInfo({
            name: file.name,
            size: file.size,
            lineCount: lineCount,
            detectedChapterName: chapObj ? `${chapObj.name} (${chapObj.teluguName})` : 'Default Chapter',
            chapterId: targetChapterId
          });
          setRawText(text);

          await parseAndPreviewText(text, targetChapterId, file.name);
          return;
        }

        // Single Non-txt file (Only Word .docx supported)
        if (!lowerName.endsWith('.docx')) {
          setParseErrors([`Unsupported file format: "${file.name}". Only TXT (.txt) and Word (.docx) formats are supported.`]);
          setIsProcessing(false);
          return;
        }

        const result = await parseUploadedWordDocument(file, chapters, targetChapterId);
        const rawList = result.questions.map(q => ({
          ...q,
          chapterId: targetChapterId || q.chapterId,
          _sourceFile: file.name
        }));
        const errs = result.errors;

        let finalList = rawList;
        if (autoTranslateTelugu && rawList.length > 0) {
          setProcessingStatus(`Auto-translating missing Telugu & formatting ${rawList.length} questions...`);
          finalList = await processImportedQuestionsTelugu(rawList, (curr, tot) => {
            setProcessingStatus(`Translating & formatting Telugu: question ${curr} of ${tot}...`);
          }, false);
        }

        setPreviewQuestions(finalList);
        setParseErrors(errs);
      } catch (err) {
        console.error(err);
        setParseErrors([`File error: ${err.message}`]);
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
      return;
    }

    // Case 2: Multi-file Bulk Upload (e.g., 2 to 29+ files dropped or selected at once)
    setLoadedFileInfo(null);
    let allQuestions = [];
    let allErrors = [];
    let fileSummaries = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const lowerName = file.name.toLowerCase();
        setProcessingStatus(`[${i + 1}/${validFiles.length}] Auto-detecting chapter & reading ${file.name}...`);

        // Auto-detect chapter from filename
        const detected = detectChapterFromFilename(file.name, chapters);
        let chapterId = detected ? detected.id : null;
        let chapterName = detected ? detected.name : null;

        let fileQuestions = [];
        let fileErrors = [];

        if (lowerName.endsWith('.txt') || file.type === 'text/plain') {
          const text = await file.text();

          // Fallback to Chapter: header in text if not detected by filename
          if (!chapterId) {
            const chapterMatch = text.match(/Chapter\s*:\s*([^\n\r]+)/i);
            if (chapterMatch && chapterMatch[1]) {
              const cName = chapterMatch[1].trim().toLowerCase();
              const found = chapters.find(
                c => c.name.toLowerCase() === cName ||
                  c.teluguName?.toLowerCase() === cName ||
                  cName.includes(c.name.toLowerCase())
              );
              if (found) {
                chapterId = found.id;
                chapterName = found.name;
              }
            }
          }

          if (!chapterId) {
            chapterId = selectedDefaultChapter;
            chapterName = chapters.find(c => c.id === selectedDefaultChapter)?.name || 'Default';
          }

          const parsed = parseStructuredBulkText(text, chapters, chapterId);
          fileQuestions = parsed.questions.map((q, qIdx) => ({
            ...q,
            id: `q-batch-${Date.now()}-${i + 1}-${qIdx + 1}`,
            chapterId: q.chapterId || chapterId,
            bookId: 'book-1',
            _sourceFile: file.name,
            _detectedChapterName: chapterName
          }));
          fileErrors = parsed.errors;
        } else if (lowerName.endsWith('.docx')) {
          if (!chapterId) chapterId = selectedDefaultChapter;
          chapterName = chapters.find(c => c.id === chapterId)?.name || 'Default';
          const result = await parseUploadedWordDocument(file, chapters, chapterId);
          fileQuestions = result.questions.map((q, qIdx) => ({
            ...q,
            id: `q-batch-${Date.now()}-${i + 1}-${qIdx + 1}`,
            chapterId: chapterId || q.chapterId,
            bookId: 'book-1',
            _sourceFile: file.name,
            _detectedChapterName: chapterName
          }));
          fileErrors = result.errors;
        } else {
          fileErrors.push(`Skipped unsupported file "${file.name}". Only .txt and .docx formats are supported.`);
        }

        allQuestions.push(...fileQuestions);
        if (fileErrors.length > 0) {
          allErrors.push(...fileErrors.map(e => `[${file.name}] ${e}`));
        }

        fileSummaries.push({
          fileName: file.name,
          chapterId: chapterId,
          chapterName: chapterName || 'Unknown',
          questionCount: fileQuestions.length,
          size: file.size
        });
      }

      // Auto-translate if toggle is active
      let finalQuestions = allQuestions;
      if (autoTranslateTelugu && finalQuestions.length > 0) {
        setProcessingStatus(`Translating missing Telugu for ${finalQuestions.length} questions across ${validFiles.length} files...`);
        finalQuestions = await processImportedQuestionsTelugu(finalQuestions, (curr, tot) => {
          setProcessingStatus(`Translating Telugu: ${curr} of ${tot} questions...`);
        }, false);
      }

      setPreviewQuestions(finalQuestions);
      setParseErrors(allErrors);
      setBatchFilesSummary({
        totalFiles: validFiles.length,
        totalQuestions: finalQuestions.length,
        files: fileSummaries
      });
      setRawText(
        `// BULK MULTI-FILE IMPORT: ${validFiles.length} files parsed with auto-detected chapters.\n` +
        `// Total Questions: ${finalQuestions.length}\n` +
        fileSummaries.map(s => `// • ${s.fileName} → Chapter: ${s.chapterName} (${s.questionCount} Questions)`).join('\n')
      );
    } catch (batchErr) {
      console.error(batchErr);
      setParseErrors([`Batch processing error: ${batchErr.message}`]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Trigger parsing of uploaded file(s) via file inputs
  const handleFilesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleProcessFiles(files);
    e.target.value = '';
  };

  // Force re-translate Telugu from English (English is primary and stays unchanged)
  const handleRetranslateTelugu = async (forceAll = true) => {
    if (previewQuestions.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setProcessingStatus('Translating all questions from English to Telugu & fixing spacing...');
    try {
      const processed = await processImportedQuestionsTelugu(previewQuestions, (curr, tot) => {
        setProcessingStatus(`Translating & respacing Telugu: ${curr} of ${tot}...`);
      }, true);
      setPreviewQuestions(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Respace existing Telugu text only
  const handleRespaceOnlyTelugu = () => {
    const respaced = previewQuestions.map(q => ({
      ...q,
      teluguQuestion: cleanAndRespaceTelugu(q.teluguQuestion || '', q.englishQuestion || ''),
      _teluguRespaced: true
    }));
    setPreviewQuestions(respaced);
  };

  // Confirm and save all questions to database & PDF (each going into its detected chapter)
  const handleConfirmImport = () => {
    if (previewQuestions.length === 0) return;
    onImportQuestions(previewQuestions);
    setImportSuccessCount(previewQuestions.length);
    setPreviewQuestions([]);
    setBatchFilesSummary(null);
  };

  const handleDownloadSampleWord = async () => {
    const sample = [
      {
        id: 'sample-1',
        chapterId: chapters[0]?.id || 'ch-1',
        questionNumber: 1,
        englishQuestion: 'What is 20% of 500?',
        teluguQuestion: '500 లో 20% ఎంత?',
        optionA: '50',
        optionB: '100',
        optionC: '150',
        optionD: '200',
        correctAnswer: 'B',
        examName: 'RRB Group D',
        examDate: '2026-03-09',
        shift: 'Shift-01',
        difficulty: 'Easy',
        topic: 'Percentage',
        solution: '20% of 500 = (20/100) * 500 = 100.'
      },
      {
        id: 'sample-2',
        chapterId: chapters[20]?.id || chapters[0]?.id || 'ch-21',
        questionNumber: 2,
        englishQuestion: 'In the given circle with centre O, triangle ABC is inscribed. If angle BOC = 160°, find angle BAC.',
        teluguQuestion: 'ఇచ్చిన వృత్తంలో O కేంద్రం మరియు త్రిభుజం ABC అంతర్లిఖితమై ఉంది. ∠BOC = 160° అయితే, ∠BAC విలువ ఎంత?',
        imageUrl: '/diagrams/triangle_in_circle.svg',
        optionA: '70°',
        optionB: '80°',
        optionC: '85°',
        optionD: '90°',
        correctAnswer: 'B',
        examName: 'RRB Technician',
        examDate: '2026-03-09',
        shift: 'Shift-01',
        difficulty: 'Medium',
        topic: 'Geometry',
        solution: 'The angle subtended by an arc at the circumference is half the angle at the centre: 160° / 2 = 80°.'
      }
    ];
    await exportQuestionsToWord(sample, chapters, 'Sample_MCQ_Template.docx');
  };

  const handleDownloadSampleTxt = () => {
    const link = document.createElement('a');
    link.href = '/sample_mcq_template.txt';
    link.download = 'Sample_MCQ_Template.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Distinct chapters and source files present in current preview list
  const distinctPreviewChapters = Array.from(new Set(previewQuestions.map(q => q.chapterId)));
  const distinctPreviewFiles = Array.from(new Set(previewQuestions.map(q => q._sourceFile).filter(Boolean)));

  // Filtered preview questions
  const filteredPreviewQuestions = previewQuestions.filter(q => {
    if (previewChapterFilter !== 'all' && q.chapterId !== previewChapterFilter) return false;
    if (previewFileFilter !== 'all' && q._sourceFile !== previewFileFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Bulk Question Importer
              </h2>
              <span className="px-2 py-0.5 text-3xs font-mono font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Auto-Detect Chapter from Filename
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Import single or multiple <span className="font-semibold text-slate-700 dark:text-slate-200">.txt files in bulk</span> at once. Chapters are automatically detected based on the file name (e.g. <code>05_compound_interest.txt</code> → Chapter 5: Compound Interest) and questions are assigned to their respective chapters!
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeMode === 'text'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Structured Text Paste</span>
              </button>
              <button
                onClick={() => setActiveMode('file')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeMode === 'file'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload TXT & Word (.docx)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mode 1: Text Paste & Bulk .txt Drag and Drop */}
      {activeMode === 'text' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Fallback Default Chapter:
              </label>
              <select
                value={selectedDefaultChapter}
                onChange={(e) => setSelectedDefaultChapter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              >
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.order}. {c.name} ({c.teluguName})</option>
                ))}
              </select>
              <span className="text-3xs text-slate-400 italic hidden md:inline">
                (Used only if chapter cannot be detected from filename or text header)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoadedFileInfo(null);
                  setBatchFilesSummary(null);
                  setRawText(SAMPLE_TEXT_TEMPLATE);
                }}
                className="flex items-center gap-1 text-2xs text-blue-600 hover:underline cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Load Sample Template</span>
              </button>
            </div>
          </div>

          {/* Dedicated Drag & Drop Zone for Bulk .txt files */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingTxt(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingTxt(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingTxt(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingTxt(false);
              const files = Array.from(e.dataTransfer.files || []);
              if (files.length > 0) {
                handleProcessFiles(files);
              }
            }}
            onClick={() => txtFileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer select-none ${isDraggingTxt
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-md ring-4 ring-blue-500/20 scale-[1.01]'
                : batchFilesSummary
                  ? 'border-purple-300 dark:border-purple-700/60 bg-purple-50/30 dark:bg-purple-950/20 hover:border-purple-500'
                  : loadedFileInfo
                    ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/70'
              }`}
          >
            <input
              ref={txtFileInputRef}
              type="file"
              multiple
              accept=".txt,.text,.json"
              onChange={handleFilesUpload}
              className="hidden"
            />

            {batchFilesSummary ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {batchFilesSummary.totalFiles} Files Loaded in Bulk
                      </span>
                      <span className="px-2 py-0.5 rounded text-3xs font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {batchFilesSummary.totalQuestions} Questions Auto-Assigned by Filename
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Chapters auto-detected from each file name and added to their respective chapters below.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => txtFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-2xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Add More .txt Files
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFilesSummary(null);
                      setLoadedFileInfo(null);
                      setRawText(SAMPLE_TEXT_TEMPLATE);
                      setPreviewQuestions([]);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                    title="Clear batch"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : loadedFileInfo ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {loadedFileInfo.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-3xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Auto-Detected: {loadedFileInfo.detectedChapterName}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(loadedFileInfo.size / 1024).toFixed(1)} KB • {loadedFileInfo.lineCount} lines • Content loaded into editor & parsed below
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => txtFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-2xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Choose More Files
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadedFileInfo(null);
                      setRawText(SAMPLE_TEXT_TEMPLATE);
                      setPreviewQuestions([]);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                    title="Clear loaded file and revert to sample"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <UploadCloud className={`w-6 h-6 ${isDraggingTxt ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {isDraggingTxt ? 'Drop your .txt files here now!' : 'Drag & Drop one or multiple .txt files here, or click to browse'}
                  </p>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Drop single or multiple files (e.g. <code>01_percentage.txt</code>, <code>05_compound_interest.txt</code>, <code>06_ratio_and_proportion.txt</code>). Chapters are automatically detected from each file's name!
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => txtFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-2xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Browse .txt Files (Multi-Select)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleTxt}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-2xs font-semibold transition-colors cursor-pointer"
                    title="Download ready-to-use sample .txt template"
                  >
                    <Download className="w-3 h-3 text-blue-600" />
                    <span>Sample .txt Template</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Telugu Translation & Spacing Toggle */}
          <div className="p-3 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 select-none">
              <input
                type="checkbox"
                checked={autoTranslateTelugu}
                onChange={(e) => setAutoTranslateTelugu(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Auto-translate missing Telugu from English & format Telugu spacing</span>
              </div>
            </label>
            <span className="text-3xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
              Preserves existing Telugu • Translates missing Telugu
            </span>
          </div>

          {/* Text Area with Direct Drag & Drop Support */}
          <div className="relative">
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingTextarea(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingTextarea(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingTextarea(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingTextarea(false);
                const files = Array.from(e.dataTransfer.files || []);
                if (files.length > 0) {
                  handleProcessFiles(files);
                }
              }}
              placeholder="Paste questions in structured format (Chapter: ..., Q1: ..., English: ..., Telugu: ..., A: ..., B: ..., C: ..., D: ..., Answer: ...) or drag and drop single/multiple .txt files directly here"
              className={`w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-xl leading-relaxed resize-y transition-all ${isDraggingTextarea
                  ? 'border-blue-500 ring-4 ring-blue-500/20 bg-blue-50/60 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700'
                }`}
            />
            {isDraggingTextarea && (
              <div className="absolute inset-0 rounded-xl bg-blue-600/10 border-2 border-dashed border-blue-500 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 animate-bounce" />
                  <span>Drop .txt file(s) to auto-detect chapters and parse!</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleParseText}
              disabled={isProcessing || !rawText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Parse & Preview Questions</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Multi-File Upload (Word / Excel / CSV / TXT) */}
      {activeMode === 'file' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 md:p-6 space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingFile(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingFile(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingFile(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingFile(false);
              const files = Array.from(e.dataTransfer.files || []);
              if (files.length > 0) {
                handleProcessFiles(files);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDraggingFile
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-500'
              }`}
          >
            <UploadCloud className={`w-12 h-12 text-blue-500 mx-auto mb-3 ${isDraggingFile ? 'animate-bounce' : ''}`} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isDraggingFile
                ? 'Drop file(s) here now!'
                : 'Upload Single or Multiple .txt or Word (.docx) Files'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
              Select or drop single or multiple <code>.txt</code> or <code>.docx</code> files. The system auto-detects chapters from the filename or document headers and assigns questions automatically!
            </p>

            {/* Telugu Translation & Spacing Toggle */}
            <div className="my-4 max-w-xl mx-auto p-3 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={autoTranslateTelugu}
                  onChange={(e) => setAutoTranslateTelugu(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Auto-translate missing Telugu from English & format Telugu spacing</span>
                </div>
              </label>
              <span className="text-3xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                Preserves existing Telugu • Translates missing Telugu
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <label className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors">
                <UploadCloud className="w-4 h-4" />
                <span>Browse Files (.txt, .docx)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.text,.docx"
                  onChange={handleFilesUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadSampleTxt}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Download ready-to-use structured text (.txt) sample template"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download .txt Template</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleWord}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Download ready-to-use Microsoft Word (.docx) sample template with picture example"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Word (.docx) Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Files Summary Card (When multiple files are loaded) */}
      {batchFilesSummary && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-800/60 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-purple-900/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Batch Files Loaded ({batchFilesSummary.totalFiles} Files)</span>
                  <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {batchFilesSummary.totalQuestions} Questions Auto-Detected
                  </span>
                </h4>
                <p className="text-2xs text-slate-500">
                  Each file was inspected and matched to its respective competitive exam chapter based on filename!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isProcessing || previewQuestions.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Confirm & Save All ({previewQuestions.length} Questions)
            </button>
          </div>

          {/* Files Breakdown Chips */}
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {batchFilesSummary.files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-2xs"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={f.fileName}>
                  {f.fileName}
                </span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {f.chapterName}
                </span>
                <span className="px-1.5 py-0.2 rounded font-mono font-bold text-3xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {f.questionCount} Qs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Processing / Translation Banner */}
      {isProcessing && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-blue-900 dark:text-blue-200">
              Processing Questions & Chapters...
            </p>
            {processingStatus && (
              <p className="text-blue-700 dark:text-blue-300 text-2xs mt-0.5">
                {processingStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Success Banner */}
      {importSuccessCount !== null && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Successfully imported {importSuccessCount} questions into their respective chapters in the Question Bank and PDF!</span>
          </div>
          <button
            onClick={onNavigateToBank}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <span>View in Question Bank</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Parsing Errors Banner */}
      {parseErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Warnings & Parsing Issues ({parseErrors.length})</span>
          </div>
          <ul className="list-disc list-inside text-2xs text-amber-700 dark:text-amber-300 space-y-0.5 pl-1 max-h-32 overflow-y-auto">
            {parseErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Review & Preview Table Before Saving */}
      {previewQuestions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Preview Parsed Questions ({previewQuestions.length})</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {distinctPreviewChapters.length} Chapters Detected
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {previewQuestions.filter(q => q.solution && q.solution.trim()).length} with Explanations
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each question is tagged with its auto-detected chapter from the file name. Click Confirm to save all questions into their respective chapters!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleRetranslateTelugu(true)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Translate ALL Telugu questions from English irrespective of current Telugu"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Re-Translate All Telugu</span>
              </button>

              <button
                type="button"
                onClick={handleRespaceOnlyTelugu}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Clean and respace Telugu text (keeps English intact)"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Fix Telugu Spacing</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewQuestions([]);
                  setBatchFilesSummary(null);
                  setLoadedFileInfo(null);
                }}
                className="px-3 py-1.5 text-slate-500 hover:text-red-500 text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Preview
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Confirm & Save All ({previewQuestions.length})
              </button>
            </div>
          </div>

          {/* Filters for multi-chapter/multi-file preview */}
          {(distinctPreviewChapters.length > 1 || distinctPreviewFiles.length > 1) && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                Filter Preview:
              </span>

              {distinctPreviewChapters.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <label className="text-2xs text-slate-500">Chapter:</label>
                  <select
                    value={previewChapterFilter}
                    onChange={(e) => setPreviewChapterFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border rounded-lg"
                  >
                    <option value="all">All Chapters ({previewQuestions.length})</option>
                    {distinctPreviewChapters.map(cid => {
                      const chap = chapters.find(c => c.id === cid);
                      const count = previewQuestions.filter(q => q.chapterId === cid).length;
                      return (
                        <option key={cid} value={cid}>
                          {chap ? `${chap.name} (${chap.teluguName})` : cid} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {distinctPreviewFiles.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <label className="text-2xs text-slate-500">Source File:</label>
                  <select
                    value={previewFileFilter}
                    onChange={(e) => setPreviewFileFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border rounded-lg font-mono text-2xs"
                  >
                    <option value="all">All Files ({distinctPreviewFiles.length})</option>
                    {distinctPreviewFiles.map(f => {
                      const count = previewQuestions.filter(q => q._sourceFile === f).length;
                      return (
                        <option key={f} value={f}>
                          {f} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <span className="text-2xs text-slate-400 ml-auto">
                Showing {filteredPreviewQuestions.length} of {previewQuestions.length} questions
              </span>
            </div>
          )}

          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5 font-semibold">Q#</th>
                  <th className="p-2.5 font-semibold">Chapter & Source File</th>
                  <th className="p-2.5 font-semibold">English Question (Primary)</th>
                  <th className="p-2.5 font-semibold">Telugu Question</th>
                  <th className="p-2.5 font-semibold">Options (A, B, C, D)</th>
                  <th className="p-2.5 font-semibold">Ans & Explanation</th>
                  <th className="p-2.5 font-semibold">Exam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPreviewQuestions.map((q, idx) => {
                  const chap = chapters.find(c => c.id === q.chapterId) || { name: 'Unknown', teluguName: '' };
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-mono font-bold text-blue-600">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-medium max-w-[170px]">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-3xs font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {chap.code || 'CH'}
                          </span>
                          <span className="truncate">{chap.name}</span>
                        </div>
                        {chap.teluguName && (
                          <div className="text-3xs font-telugu text-slate-500 dark:text-slate-400 truncate">
                            {chap.teluguName}
                          </div>
                        )}
                        {q._sourceFile && (
                          <div className="text-3xs font-mono text-purple-600 dark:text-purple-400 truncate mt-0.5 flex items-center gap-1" title={q._sourceFile}>
                            <FileCode className="w-3 h-3 shrink-0" />
                            <span className="truncate">{q._sourceFile}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 max-w-xs text-slate-900 dark:text-white">
                        <div className="truncate">
                          <MathRenderer text={q.englishQuestion} />
                        </div>
                        {q.imageUrl && (
                          <div className="mt-1 flex items-center gap-1 text-3xs font-mono text-blue-600 dark:text-blue-400">
                            <ImageIcon className="w-3 h-3 shrink-0" />
                            <span className="font-semibold">Question Pic:</span>
                            <a
                              href={q.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline truncate max-w-[120px] hover:text-blue-700"
                              title={q.imageUrl}
                            >
                              {q.imageUrl.startsWith('data:') ? 'base64 image' : q.imageUrl.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 max-w-xs font-telugu font-bold text-red-600 dark:text-red-400">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">
                            <MathRenderer text={q.teluguQuestion} />
                          </span>
                          {q._teluguAutoTranslated && (
                            <span className="shrink-0 px-1.5 py-0.5 text-3xs font-sans font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                              Translated
                            </span>
                          )}
                          {q._teluguRespaced && !q._teluguAutoTranslated && (
                            <span className="shrink-0 px-1.5 py-0.5 text-3xs font-sans font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                              Respaced
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-2xs text-slate-600 dark:text-slate-400">
                        A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                      </td>
                      <td className="p-2.5 max-w-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 mb-1">
                          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-2xs font-mono">
                            Ans: ({q.correctAnswer.toLowerCase()})
                          </span>
                        </div>
                        {q.solution && q.solution.trim() ? (
                          <div className="text-3xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded border border-slate-200 dark:border-slate-700 max-h-20 overflow-y-auto leading-relaxed">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">EXPLANATION:</span>
                            <MathRenderer text={q.solution} />
                          </div>
                        ) : (
                          <span className="text-3xs text-slate-400 dark:text-slate-500 italic">No explanation</span>
                        )}
                        {q.solutionImageUrl && (
                          <div className="mt-1 flex items-center gap-1 text-3xs font-mono text-emerald-600 dark:text-emerald-400">
                            <ImageIcon className="w-3 h-3 shrink-0" />
                            <span className="font-semibold">Solution Pic:</span>
                            <a
                              href={q.solutionImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline truncate max-w-[120px] hover:text-emerald-700"
                              title={q.solutionImageUrl}
                            >
                              {q.solutionImageUrl.startsWith('data:') ? 'base64 image' : q.solutionImageUrl.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-2xs text-slate-500 whitespace-nowrap">
                        {q.examName} ({q.shift})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Import All {previewQuestions.length} Questions to Database & PDF
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkImportTab;
