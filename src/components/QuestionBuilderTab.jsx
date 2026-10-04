import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  PlusCircle,
  RotateCcw,
  Languages,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Check,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  Columns,
  Rows,
  Image as ImageIcon
} from 'lucide-react';
import MathToolbar from './MathToolbar';
import TeluguTermsHelper from './TeluguTermsHelper';
import AdaptiveQuestionBody from './AdaptiveQuestionBody';
import MathRenderer, { getCleanSolutionText } from '../utils/mathParser';
import { translateEnglishToTelugu } from '../utils/translator';
import { findDuplicateQuestion } from '../utils/duplicateChecker';

const QuestionBuilderTab = ({
  chapters,
  questions,
  draft,
  onSaveQuestion,
  onUpdateDraft,
  onClearDraft,
  selectedChapterId,
  editingQuestion = null,
  onCancelEdit = null,
  onNavigateToPDF,
  books = [],
  activeBookId = 'book-1',
  onAddSubsection = null
}) => {
  // Form State
  const [formData, setFormData] = useState({
    id: editingQuestion?.id || `q-${Date.now()}`,
    bookId: editingQuestion?.bookId || activeBookId || 'book-1',
    chapterId: editingQuestion?.chapterId || selectedChapterId || chapters[0]?.id || 'ch-1',
    subsectionId: editingQuestion?.subsectionId || '',
    questionNumber: editingQuestion?.questionNumber || 1,
    englishQuestion: editingQuestion?.englishQuestion || '',
    teluguQuestion: editingQuestion?.teluguQuestion || '',
    imageUrl: editingQuestion?.imageUrl || '',
    solutionImageUrl: editingQuestion?.solutionImageUrl || '',
    optionA: editingQuestion?.optionA || '',
    optionB: editingQuestion?.optionB || '',
    optionC: editingQuestion?.optionC || '',
    optionD: editingQuestion?.optionD || '',
    correctAnswer: editingQuestion?.correctAnswer || '',
    examName: editingQuestion?.examName || 'RRB Technician',
    examDate: editingQuestion?.examDate || new Date().toISOString().split('T')[0],
    shift: editingQuestion?.shift || 'Shift-02',
    difficulty: editingQuestion?.difficulty || 'Medium',
    topic: editingQuestion?.topic || '',
    solution: editingQuestion?.solution || ''
  });

  const [isAddingInlineSub, setIsAddingInlineSub] = useState(false);
  const [inlineSubName, setInlineSubName] = useState('');
  const [inlineSubTelugu, setInlineSubTelugu] = useState('');
  const [inlineSubCode, setInlineSubCode] = useState('');
  const [isManualQNo, setIsManualQNo] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationSuccess, setTranslationSuccess] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved ✓');
  const [previewOptionLayout, setPreviewOptionLayout] = useState('auto'); // auto, grid, stacked
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [questionColumnsLayout, setQuestionColumnsLayout] = useState('two'); // 'two' | 'single' (2 columns side-by-side)

  const englishInputRef = useRef(null);
  const teluguInputRef = useRef(null);
  const solutionInputRef = useRef(null);
  const [activeField, setActiveField] = useState('english'); // 'english' | 'telugu' | 'solution'

  // Calculate next question number for chosen chapter if not editing and not manual
  useEffect(() => {
    if (!editingQuestion && !isManualQNo) {
      const chapterQuestions = questions.filter(q => q.chapterId === formData.chapterId);
      const nextNo = chapterQuestions.length + 1;
      setFormData(prev => ({ ...prev, questionNumber: nextNo }));
    }
  }, [formData.chapterId, questions, editingQuestion, isManualQNo]);

  // Load draft if available on initial mount when not editing
  useEffect(() => {
    if (!editingQuestion && draft && !formData.englishQuestion) {
      setFormData(prev => ({
        ...prev,
        ...draft,
        id: `q-${Date.now()}`
      }));
    }
  }, []);

  // Update auto-save whenever formData changes
  useEffect(() => {
    if (editingQuestion) return;
    setAutoSaveStatus('Saving...');
    const timer = setTimeout(() => {
      onUpdateDraft(formData);
      setAutoSaveStatus('Saved ✓');
    }, 400);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper to insert snippet at cursor in the currently active field
  const handleInsertSnippet = (snippet) => {
    let targetRef = null;
    let fieldKey = 'englishQuestion';

    if (activeField === 'telugu') {
      targetRef = teluguInputRef.current;
      fieldKey = 'teluguQuestion';
    } else if (activeField === 'solution') {
      targetRef = solutionInputRef.current;
      fieldKey = 'solution';
    } else {
      targetRef = englishInputRef.current;
      fieldKey = 'englishQuestion';
    }

    if (!targetRef) return;

    const start = targetRef.selectionStart || 0;
    const end = targetRef.selectionEnd || 0;
    const currentVal = formData[fieldKey] || '';
    const newVal = currentVal.substring(0, start) + snippet + currentVal.substring(end);

    setFormData(prev => ({ ...prev, [fieldKey]: newVal }));

    setTimeout(() => {
      targetRef.focus();
      const newPos = start + snippet.length;
      targetRef.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Automated translation handler
  const handleAutoTranslate = async () => {
    if (!formData.englishQuestion.trim()) return;
    setIsTranslating(true);
    setTranslationSuccess(false);
    try {
      const teluguResult = await translateEnglishToTelugu(formData.englishQuestion);
      setFormData(prev => ({ ...prev, teluguQuestion: teluguResult }));
      setTranslationSuccess(true);
      setTimeout(() => setTranslationSuccess(false), 3000);
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  // Form submission: validates and triggers duplicate check
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.englishQuestion.trim() && !formData.teluguQuestion.trim()) {
      alert('Please enter the question text (English or Telugu).');
      return;
    }

    if (!formData.optionA.trim() || !formData.optionB.trim()) {
      alert('Please fill in at least Option A and Option B.');
      return;
    }

    onSaveQuestion(formData);
  };

  const handleReset = () => {
    if (confirm('Clear form and reset draft?')) {
      onClearDraft();
      const chapterQuestions = questions.filter(q => q.chapterId === formData.chapterId);
      setFormData({
        id: `q-${Date.now()}`,
        chapterId: formData.chapterId,
        questionNumber: chapterQuestions.length + 1,
        englishQuestion: '',
        teluguQuestion: '',
        imageUrl: '',
        solutionImageUrl: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: '',
        examName: 'RRB Technician',
        examDate: new Date().toISOString().split('T')[0],
        shift: 'Shift-02',
        difficulty: 'Medium',
        topic: '',
        solution: ''
      });
    }
  };

  // Determine option layout in preview
  const isLongOptions =
    formData.optionA.length > 25 ||
    formData.optionB.length > 25 ||
    formData.optionC.length > 25 ||
    formData.optionD.length > 25;

  const currentChapter = chapters.find(c => c.id === formData.chapterId) || chapters[0];
  const currentSubsections = currentChapter?.subsections || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
      
      {/* LEFT COLUMN: Question Entry Form (7 cols on lg) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 md:p-6">
          
          {/* Header & Status */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {editingQuestion ? 'Edit MCQ Question' : 'Bilingual Question Builder'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step-by-step entry. Questions are automatically formatted and indexed into the PDF book.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {autoSaveStatus}
              </span>
              {editingQuestion && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            
            {/* Row 1: Book Edition, Chapter & Question Number */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {books && books.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Book Edition *
                  </label>
                  <select
                    value={formData.bookId || activeBookId}
                    onChange={(e) => handleChange('bookId', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white truncate"
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title.substring(0, 20)} ({b.publicationDate || '2026'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={books && books.length > 0 ? "sm:col-span-2" : "sm:col-span-2"}>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Chapter *
                </label>
                <select
                  value={formData.chapterId}
                  onChange={(e) => handleChange('chapterId', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {chapters.map((chap, idx) => (
                    <option key={chap.id} value={chap.id}>
                      {idx + 1}. {chap.name} ({chap.teluguName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Question No.
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualQNo(!isManualQNo)}
                    className="text-2xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isManualQNo ? 'Auto' : 'Manual'}
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  value={formData.questionNumber}
                  onChange={(e) => handleChange('questionNumber', parseInt(e.target.value) || 1)}
                  readOnly={!isManualQNo}
                  className={`w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white ${!isManualQNo ? 'opacity-80' : 'ring-1 ring-blue-500'}`}
                />
              </div>
            </div>

            {/* Row 1.5: Subsection as Chapter / Topic */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Subsection / Sub-Chapter / Topic (ఉప విభాగం / మోడల్)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingInlineSub(!isAddingInlineSub)}
                  className="text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isAddingInlineSub ? 'Cancel' : '+ New Subsection'}
                </button>
              </div>

              {!isAddingInlineSub ? (
                <div className="flex items-center gap-2">
                  <select
                    value={formData.subsectionId || ''}
                    onChange={(e) => {
                      const subId = e.target.value;
                      const matched = currentSubsections.find(s => s.id === subId);
                      handleChange('subsectionId', subId);
                      handleChange('topic', matched ? matched.name : '');
                    }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- General / No Subsection (సాధారణ) --</option>
                    {currentSubsections.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code ? `[${sub.code}] ` : ''}{sub.name} ({sub.teluguName})
                      </option>
                    ))}
                  </select>
                  {formData.subsectionId && (
                    <span className="text-2xs font-bold px-2 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      Section Active
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Code (e.g. 1.1)"
                    value={inlineSubCode}
                    onChange={(e) => setInlineSubCode(e.target.value)}
                    className="w-24 px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="English Subsection Name (e.g. Fraction to Percentage)..."
                    value={inlineSubName}
                    onChange={(e) => setInlineSubName(e.target.value)}
                    className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="తెలుగు పేరు (e.g. భిన్నం నుండి శాతం)..."
                    value={inlineSubTelugu}
                    onChange={(e) => setInlineSubTelugu(e.target.value)}
                    className="flex-1 min-w-[160px] px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-telugu"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!inlineSubName.trim()) return;
                      if (onAddSubsection) {
                        const newId = onAddSubsection(formData.chapterId, {
                          name: inlineSubName.trim(),
                          teluguName: inlineSubTelugu.trim() || inlineSubName.trim(),
                          code: inlineSubCode.trim()
                        });
                        handleChange('subsectionId', newId);
                        handleChange('topic', inlineSubName.trim());
                      }
                      setInlineSubName('');
                      setInlineSubTelugu('');
                      setInlineSubCode('');
                      setIsAddingInlineSub(false);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Save & Select
                  </button>
                </div>
              )}
            </div>

            {/* Quick Math Toolbar */}
            <MathToolbar onInsert={handleInsertSnippet} label={`Math Insert (${activeField})`} />

            {/* Question Inputs Layout Header & Toggle */}
            <div className="flex items-center justify-between pt-1 pb-1 border-b border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Question Content (English & Telugu)</span>
              </label>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-2xs font-semibold">
                <button
                  type="button"
                  onClick={() => setQuestionColumnsLayout('two')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    questionColumnsLayout === 'two'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="Two Columns: English and Telugu side-by-side"
                >
                  <Columns className="w-3 h-3" />
                  <span>2 Columns</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionColumnsLayout('single')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    questionColumnsLayout === 'single'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="Single Column: English and Telugu stacked"
                >
                  <Rows className="w-3 h-3" />
                  <span>1 Column</span>
                </button>
              </div>
            </div>

            {/* English & Telugu Question Editors (Two Columns or Single Column) */}
            <div className={questionColumnsLayout === 'two' ? "grid grid-cols-1 lg:grid-cols-2 gap-3.5" : "space-y-3.5"}>
              
              {/* English Question Editor Column */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    English Question *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoTranslate}
                    disabled={isTranslating || !formData.englishQuestion.trim()}
                    className="flex items-center gap-1 px-2 py-0.5 text-2xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-40 cursor-pointer"
                    title="Translate English to Mathematical Telugu"
                  >
                    <Languages className="w-3 h-3" />
                    <span>{isTranslating ? 'Translating...' : 'Translate →'}</span>
                  </button>
                </div>
                <textarea
                  ref={englishInputRef}
                  rows={questionColumnsLayout === 'two' ? 4 : 3}
                  placeholder="Enter English question text (e.g. What is 25% of 400? or If x + 1/x = 5...)"
                  value={formData.englishQuestion}
                  onFocus={() => setActiveField('english')}
                  onChange={(e) => handleChange('englishQuestion', e.target.value)}
                  className="w-full flex-1 p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed resize-y min-h-[95px]"
                  required
                />
                {translationSuccess && (
                  <div className="text-2xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Translated to Telugu successfully with math terminology!
                  </div>
                )}
              </div>

              {/* Telugu Question Editor Column */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Telugu Question <span className="font-telugu font-bold text-xs">(తెలుగు ప్రశ్న)</span> *
                  </label>
                  <span className="text-2xs text-slate-400">
                    Math & LaTeX
                  </span>
                </div>
                <textarea
                  ref={teluguInputRef}
                  rows={questionColumnsLayout === 'two' ? 4 : 3}
                  placeholder="తెలుగు ప్రశ్న రాయండి (ఉదా: 400 లో 25% ఎంత?)"
                  value={formData.teluguQuestion}
                  onFocus={() => setActiveField('telugu')}
                  onChange={(e) => handleChange('teluguQuestion', e.target.value)}
                  className="w-full flex-1 p-3 text-xs sm:text-sm bg-emerald-50/20 dark:bg-slate-800/80 border border-emerald-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-telugu leading-relaxed resize-y min-h-[95px]"
                  required
                />
              </div>

            </div>

            {/* Telugu Terms Quick Pills */}
            <TeluguTermsHelper onInsert={handleInsertSnippet} />

            {/* 4 Options (A, B, C, D) */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Four Options (A, B, C, D)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'optionA', label: '(a)', placeholder: 'Option A (e.g. 50)' },
                  { key: 'optionB', label: '(b)', placeholder: 'Option B (e.g. 75)' },
                  { key: 'optionC', label: '(c)', placeholder: 'Option C (e.g. 100)' },
                  { key: 'optionD', label: '(d)', placeholder: 'Option D (e.g. 125)' },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <span className="w-7 text-center font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      {opt.label}
                    </span>
                    <input
                      type="text"
                      placeholder={opt.placeholder}
                      value={formData[opt.key]}
                      onChange={(e) => handleChange(opt.key, e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Question Diagram / Figure (Shows in Question Section only) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Question Diagram / Picture:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-2xs bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">Shows in Question Section only</span>
                </label>
                <label className="text-2xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1">
                  <span>Browse Question Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          handleChange('imageUrl', event.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <input
                type="text"
                placeholder="Or paste question image URL (e.g. /diagrams/triangle_in_circle.svg or data:image/...)"
                value={formData.imageUrl || ''}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500"
              />
              {formData.imageUrl && (
                <div className="pt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-semibold text-slate-500">Question Image Preview:</span>
                    <img
                      src={formData.imageUrl}
                      alt="Question Diagram Preview"
                      className="h-12 w-auto max-w-[120px] object-contain rounded border border-slate-200 dark:border-slate-700 bg-white p-0.5"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('imageUrl', '')}
                    className="text-2xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Remove Question Image
                  </button>
                </div>
              )}
            </div>

            {/* Correct Answer Dropdown (Optional) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Correct Answer:</span>
                <span className="text-slate-400 font-normal text-2xs">(Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={formData.correctAnswer}
                  onChange={(e) => handleChange('correctAnswer', e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]"
                >
                  <option value="">-- None / Skip (Optional) --</option>
                  <option value="A">Option (a)</option>
                  <option value="B">Option (b)</option>
                  <option value="C">Option (c)</option>
                  <option value="D">Option (d)</option>
                </select>
                {formData.correctAnswer && (
                  <button
                    type="button"
                    onClick={() => handleChange('correctAnswer', '')}
                    className="text-2xs text-rose-500 dark:text-rose-400 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Exam Details & Metadata Dropdown */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 overflow-hidden transition-all duration-200">
              <button
                type="button"
                onClick={() => setShowExamDetails(!showExamDetails)}
                className="w-full p-2.5 flex items-center justify-between gap-2 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                title={showExamDetails ? 'Click to collapse exam details' : 'Click to expand exam details'}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Exam Details & Metadata</span>
                  <span className="text-2xs font-normal text-slate-500 truncate max-w-xs sm:max-w-md">
                    ({formData.examName || 'Exam'} • {formData.shift} • {formData.difficulty})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-2xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>{showExamDetails ? 'Collapse ▲' : 'Dropdown ▼'}</span>
                  {showExamDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showExamDetails && (
                <div className="p-3.5 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                  {/* Exam Details Row: Exam Name, Date, Shift */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Exam Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RRB Technician"
                        value={formData.examName}
                        onChange={(e) => handleChange('examName', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Exam Date
                      </label>
                      <input
                        type="date"
                        value={formData.examDate}
                        onChange={(e) => handleChange('examDate', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Shift
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shift-02"
                        value={formData.shift}
                        onChange={(e) => handleChange('shift', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Optional Difficulty & Subtopic */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => handleChange('difficulty', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Topic / Subtopic (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Basic Percentage Calculation"
                        value={formData.topic}
                        onChange={(e) => handleChange('topic', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation / Solution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1 gap-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Explanation / Step-by-Step Solution (Optional)
                  </label>
                  <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Shows in Solutions Section only
                  </span>
                </div>
              </div>
              <textarea
                ref={solutionInputRef}
                rows={3}
                placeholder="Step 1: 25% of 400 = (25 / 100) * 400&#10;Step 2: = 100&#10;Final Answer: 100 (Option C)"
                value={formData.solution}
                onFocus={() => setActiveField('solution')}
                onChange={(e) => handleChange('solution', e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
              />

              {/* Solution Picture / Diagram Input */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Solution Diagram / Picture:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-2xs bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Shows in Solutions Section only
                    </span>
                  </label>
                  <label className="text-2xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1">
                    <span>Browse Solution Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            handleChange('solutionImageUrl', event.target.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Or paste solution image URL (e.g. data:image/... or https://...)"
                  value={formData.solutionImageUrl || ''}
                  onChange={(e) => handleChange('solutionImageUrl', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500"
                />
                {formData.solutionImageUrl && (
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-semibold text-emerald-700 dark:text-emerald-300">Solution Image Preview:</span>
                      <img
                        src={formData.solutionImageUrl}
                        alt="Solution Diagram Preview"
                        className="h-12 w-auto max-w-[120px] object-contain rounded border border-emerald-300 dark:border-emerald-700 bg-white p-0.5"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('solutionImageUrl', '')}
                      className="text-2xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Remove Solution Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Form
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  {editingQuestion ? 'Update Question' : '+ ADD QUESTION'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    handleSubmit(e);
                    setTimeout(() => onNavigateToPDF(), 150);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  SAVE & ADD TO PDF
                </button>
              </div>
            </div>

          </form>

        </div>
      </div>

      {/* RIGHT COLUMN: Live Question Preview (5 cols on lg) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="sticky top-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 md:p-6">
          
          {/* Preview Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Question Preview
                </h3>
                <p className="text-2xs text-slate-500">
                  Exact competitive exam book layout
                </p>
              </div>
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-2xs">
              <button
                type="button"
                onClick={() => setPreviewOptionLayout('auto')}
                className={`px-2 py-0.5 rounded cursor-pointer ${previewOptionLayout === 'auto' ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-blue-600' : 'text-slate-500'}`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setPreviewOptionLayout('grid')}
                className={`px-2 py-0.5 rounded cursor-pointer ${previewOptionLayout === 'grid' ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-blue-600' : 'text-slate-500'}`}
              >
                2×2
              </button>
              <button
                type="button"
                onClick={() => setPreviewOptionLayout('stacked')}
                className={`px-2 py-0.5 rounded cursor-pointer ${previewOptionLayout === 'stacked' ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-blue-600' : 'text-slate-500'}`}
              >
                1-Col
              </button>
            </div>
          </div>

          {/* Realistic Book Page Sheet Preview */}
          <div className="mt-4 p-5 bg-amber-50/30 dark:bg-slate-950/60 rounded-xl border border-amber-200/60 dark:border-slate-800 font-sans shadow-inner">
            
            {/* Chapter Running Indicator */}
            <div className="text-2xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 pb-2 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>{currentChapter.name} • <span className="font-telugu font-bold">{currentChapter.teluguName}</span></span>
              <span className="text-blue-600 font-mono">Q#{formData.questionNumber}</span>
            </div>

            {/* Question Card formatted like official book */}
            <div className="space-y-2.5">
              
              {/* Subsection Badge */}
              {(formData.subsectionId || formData.topic) && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-2xs font-semibold border border-blue-200 dark:border-blue-800/40">
                  <Layers className="w-2.5 h-2.5" />
                  <span>
                    § {currentSubsections.find(s => s.id === formData.subsectionId)?.code ? `[${currentSubsections.find(s => s.id === formData.subsectionId)?.code}] ` : ''}
                    {formData.topic || currentSubsections.find(s => s.id === formData.subsectionId)?.name || 'Subsection'}
                  </span>
                </div>
              )}
              
              {/* Adaptive Question Body: fits into text div if aspect ratio is wide */}
              <AdaptiveQuestionBody
                englishQuestion={formData.englishQuestion}
                teluguQuestion={formData.teluguQuestion}
                imageUrl={formData.imageUrl}
                questionNumber={formData.questionNumber}
                questionNumberColor="text-blue-700 dark:text-blue-400"
              />

              {/* Options Layout */}
              <div className="pt-2 pl-6">
                {(previewOptionLayout === 'stacked' || (previewOptionLayout === 'auto' && isLongOptions)) ? (
                  // Stacked 1-Column Layout
                  <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">(a)</span>
                      <MathRenderer text={formData.optionA || 'Option A'} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">(b)</span>
                      <MathRenderer text={formData.optionB || 'Option B'} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">(c)</span>
                      <MathRenderer text={formData.optionC || 'Option C'} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">(d)</span>
                      <MathRenderer text={formData.optionD || 'Option D'} />
                    </div>
                  </div>
                ) : (
                  // 2x2 Grid Layout
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">(a)</span>
                      <MathRenderer text={formData.optionA || 'Option A'} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">(b)</span>
                      <MathRenderer text={formData.optionB || 'Option B'} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">(c)</span>
                      <MathRenderer text={formData.optionC || 'Option C'} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">(d)</span>
                      <MathRenderer text={formData.optionD || 'Option D'} />
                    </div>
                  </div>
                )}
              </div>

              {/* Exam Tag Badge */}
              <div className="pt-3.5 mt-2 pl-6 flex items-center justify-between">
                <span className="inline-block text-2xs font-mono font-medium px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {formData.examName || 'Exam'} | {formData.examDate} | {formData.shift}
                </span>

                {formData.correctAnswer ? (
                  <span className="text-2xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                    Ans: ({formData.correctAnswer.toLowerCase()})
                  </span>
                ) : (
                  <span className="text-2xs text-slate-400 italic">
                    Ans: (Optional / Unset)
                  </span>
                )}
              </div>

            </div>

            {/* Solution Box in Preview */}
            {(formData.solution || formData.solutionImageUrl) && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-emerald-500" />
                    <span>Solution / Explanation</span>
                  </div>
                  {formData.solutionImageUrl && (
                    <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      + Solution Diagram
                    </span>
                  )}
                </div>
                <div className="text-2xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {formData.solution && <MathRenderer text={getCleanSolutionText(formData.solution, formData.solutionImageUrl)} />}
                  {formData.solutionImageUrl && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center max-w-full overflow-hidden">
                      <img
                        src={formData.solutionImageUrl}
                        alt="Solution Diagram"
                        className="max-h-36 w-auto max-w-full h-auto object-contain rounded border border-slate-200 dark:border-slate-700 bg-white p-1"
                        style={{ maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Quick Guidance Info */}
          <div className="mt-4 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 text-2xs text-blue-900 dark:text-blue-300 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pro-Tip for Fast Creation:
            </div>
            <p>
              Type the English question, click <b>TRANSLATE TO TELUGU</b> to automatically get accurate mathematical Telugu, enter options, and click <b>+ ADD QUESTION</b>.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default QuestionBuilderTab;
