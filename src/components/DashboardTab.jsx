import React, { useState } from 'react';
import {
  HelpCircle,
  FolderPlus,
  ArrowRight,
  PlusCircle,
  FileText,
  Search,
  Award,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  MoveUp,
  MoveDown,
  ChevronDown,
  ChevronUp,
  Tag,
  Plus
} from 'lucide-react';

const DashboardTab = ({
  chapters,
  questions,
  draft,
  onSelectChapter,
  onNavigateToBuilder,
  onNavigateToBank,
  onNavigateToPDF,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  onReorderChapters,
  books = [],
  activeBookId = 'book-1',
  onSelectBook,
  onAddBook,
  onAddSubsection,
  onDeleteSubsection
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [chapterEntryType, setChapterEntryType] = useState('chapter'); // 'chapter' | 'subsection'
  const [parentChapterId, setParentChapterId] = useState(chapters[0]?.id || 'ch-1');
  const [newSubCode, setNewSubCode] = useState('');
  const [expandedSubsections, setExpandedSubsections] = useState({});
  const [quickSubName, setQuickSubName] = useState({});
  const [quickSubTelugu, setQuickSubTelugu] = useState({});
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookSubtitle, setNewBookSubtitle] = useState('');
  const [newBookDate, setNewBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBookExams, setNewBookExams] = useState('RRB / SSC / Govt Exams');
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterTelugu, setNewChapterTelugu] = useState('');
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTelugu, setEditTelugu] = useState('');

  // Calculate stats
  const totalQuestions = questions.length;
  const totalChapters = chapters.length;
  const draftCount = draft && draft.englishQuestion ? 1 : 0;
  const publishedCount = totalQuestions;

  // Distinct exams
  const distinctExams = Array.from(new Set(questions.map(q => q.examName).filter(Boolean)));

  // Map question counts per chapter
  const questionCountByChapter = {};
  questions.forEach(q => {
    questionCountByChapter[q.chapterId] = (questionCountByChapter[q.chapterId] || 0) + 1;
  });

  // Filtered chapters
  const filteredChapters = chapters.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teluguName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateChapter = (e) => {
    e.preventDefault();
    if (chapterEntryType === 'chapter') {
      if (!newChapterName.trim()) return;
      onAddChapter({
        name: newChapterName.trim(),
        teluguName: newChapterTelugu.trim() || newChapterName.trim()
      });
      setNewChapterName('');
      setNewChapterTelugu('');
      setIsAddingChapter(false);
    } else {
      if (!newChapterName.trim()) return;
      if (onAddSubsection) {
        onAddSubsection(parentChapterId, {
          name: newChapterName.trim(),
          teluguName: newChapterTelugu.trim() || newChapterName.trim(),
          code: newSubCode.trim()
        });
      }
      setNewChapterName('');
      setNewChapterTelugu('');
      setNewSubCode('');
      setIsAddingChapter(false);
    }
  };

  const toggleExpandSubsections = (chapId) => {
    setExpandedSubsections(prev => ({
      ...prev,
      [chapId]: !prev[chapId]
    }));
  };

  const handleQuickAddSub = (chapId) => {
    const name = (quickSubName[chapId] || '').trim();
    if (!name) return;
    const telugu = (quickSubTelugu[chapId] || '').trim();
    if (onAddSubsection) {
      onAddSubsection(chapId, { name, teluguName: telugu || name });
    }
    setQuickSubName(prev => ({ ...prev, [chapId]: '' }));
    setQuickSubTelugu(prev => ({ ...prev, [chapId]: '' }));
  };

  const handleStartEdit = (chap) => {
    setEditingChapterId(chap.id);
    setEditName(chap.name);
    setEditTelugu(chap.teluguName);
  };

  const handleSaveEdit = (chapId) => {
    if (!editName.trim()) return;
    onEditChapter(chapId, {
      name: editName.trim(),
      teluguName: editTelugu.trim() || editName.trim()
    });
    setEditingChapterId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner / Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Educational Publishing Suite for Railway, SSC & State Govt. Exams
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Bilingual Question Builder & PDF Generator
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Create exam questions in English and Telugu simultaneously with instant Math formulas, automatic chapter numbering, live layout preview, and 1-click A4 Book PDF compilation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToBuilder()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + Add New Question
            </button>
            <button
              onClick={onNavigateToPDF}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              View Book Preview
            </button>
          </div>
        </div>
      </div>

      {/* Book-Wise & Date Management Card */}
      {books && books.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Active Book Edition:
                </span>
                <span className="px-2 py-0.5 text-2xs font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-md">
                  📅 Publication Date: {books.find(b => b.id === activeBookId)?.publicationDate || '2026-03-09'}
                </span>
                <span className="px-2 py-0.5 text-2xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-md">
                  {totalQuestions} Questions Loaded
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {books.find(b => b.id === activeBookId)?.title || 'Railway & SSC Mathematics'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {books.find(b => b.id === activeBookId)?.subtitle || 'Chapter-Wise Bilingual Practice Book'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeBookId}
              onChange={(e) => onSelectBook && onSelectBook(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer max-w-[220px] truncate"
            >
              {books.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.publicationDate || '2026'})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsAddingBook(true)}
              className="px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 cursor-pointer whitespace-nowrap"
            >
              + New Book
            </button>
          </div>
        </div>
      )}

      {/* New Book Modal */}
      {isAddingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Create New Book (Book-Wise System)
              </h3>
              <button onClick={() => setIsAddingBook(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Railway Group D & NTPC Maths"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bilingual Practice Question Bank"
                  value={newBookSubtitle}
                  onChange={(e) => setNewBookSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Book Publication Date *
                  </label>
                  <input
                    type="date"
                    value={newBookDate}
                    onChange={(e) => setNewBookDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Exams
                  </label>
                  <input
                    type="text"
                    value={newBookExams}
                    onChange={(e) => setNewBookExams(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingBook(false)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newBookTitle.trim()) return;
                  if (onAddBook) {
                    onAddBook({
                      title: newBookTitle.trim(),
                      subtitle: newBookSubtitle.trim(),
                      publicationDate: newBookDate,
                      examCategory: newBookExams.trim()
                    });
                  }
                  setIsAddingBook(false);
                  setNewBookTitle('');
                  setNewBookSubtitle('');
                }}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Create Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Questions
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalQuestions}
            </span>
            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Live in PDF
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Chapters
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalChapters}
            </span>
            <span className="text-2xs text-slate-500">
              Exam Modules
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Draft Questions
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {draftCount}
            </span>
            <span className="text-2xs text-purple-600 dark:text-purple-400 font-semibold">
              Auto-Saved
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Exams Covered
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {distinctExams.length || 1}
            </span>
            <span className="text-2xs text-slate-500 truncate max-w-[100px]">
              RRB, SSC & more
            </span>
          </div>
        </div>

      </div>

      {/* Chapters Management Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5">
        
        {/* Section Title, Search, and Add Chapter Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Chapter Management & Question Collections
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any chapter to view its question bank, add questions, or export its dedicated PDF.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search chapter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white w-48 sm:w-60 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setIsAddingChapter(!isAddingChapter)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{isAddingChapter ? 'Cancel' : 'New Chapter'}</span>
            </button>
          </div>
        </div>

        {/* Inline New Chapter Form */}
        {isAddingChapter && (
          <div className="my-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 border-b border-blue-200 dark:border-blue-800/40 pb-2.5">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Add Item Type:</span>
              <button
                type="button"
                onClick={() => setChapterEntryType('chapter')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  chapterEntryType === 'chapter'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                📁 Main Chapter
              </button>
              <button
                type="button"
                onClick={() => setChapterEntryType('subsection')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  chapterEntryType === 'subsection'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                📑 Subsection as Chapter / Topic
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="flex flex-wrap items-center gap-3">
              {chapterEntryType === 'subsection' && (
                <div className="w-full sm:w-auto min-w-[200px]">
                  <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Chapter *
                  </label>
                  <select
                    value={parentChapterId}
                    onChange={(e) => setParentChapterId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {chapters.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {i + 1}. {c.name} ({c.teluguName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {chapterEntryType === 'subsection' && (
                <div className="w-24">
                  <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code / Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.1"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex-1 min-w-[200px]">
                <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {chapterEntryType === 'chapter' ? 'English Chapter Name *' : 'Subsection Title (English) *'}
                </label>
                <input
                  type="text"
                  placeholder={chapterEntryType === 'chapter' ? "e.g. Surds & Indices" : "e.g. Fraction to Percentage"}
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {chapterEntryType === 'chapter' ? 'Telugu Chapter Name (తెలుగు పేరు)' : 'Telugu Name (తెలుగు పేరు)'}
                </label>
                <input
                  type="text"
                  placeholder={chapterEntryType === 'chapter' ? "e.g. కరణులు & ఘాతాంకాలు" : "e.g. భిన్నం నుండి శాతం"}
                  value={newChapterTelugu}
                  onChange={(e) => setNewChapterTelugu(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                >
                  {chapterEntryType === 'chapter' ? 'Save Chapter' : 'Add Subsection'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Chapters Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-4">
          {filteredChapters.map((chap, idx) => {
            const count = questionCountByChapter[chap.id] || 0;
            const isEditing = editingChapterId === chap.id;

            return (
              <div
                key={chap.id}
                className="group relative bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700/60 rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-2xs font-bold font-mono px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      CH-{idx + 1}
                    </span>

                    {/* Card Actions: Edit, Delete, Reorder */}
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onReorderChapters(chap.id, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onReorderChapters(chap.id, 'down')}
                        disabled={idx === chapters.length - 1}
                        title="Move Down"
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(chap)}
                        title="Rename Chapter"
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {chapters.length > 1 && (
                        <button
                          onClick={() => onDeleteChapter(chap.id)}
                          title="Delete Chapter"
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chapter Names (View vs Edit Mode) */}
                  {isEditing ? (
                    <div className="space-y-1.5 my-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border rounded"
                      />
                      <input
                        type="text"
                        value={editTelugu}
                        onChange={(e) => setEditTelugu(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border rounded font-telugu"
                      />
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleSaveEdit(chap.id)}
                          className="px-2 py-0.5 text-2xs bg-blue-600 text-white rounded font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingChapterId(null)}
                          className="px-2 py-0.5 text-2xs bg-slate-200 dark:bg-slate-700 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {chap.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-telugu">
                        {chap.teluguName}
                      </p>
                    </div>
                  )}

                  {/* Subsections Expand Toggle */}
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => toggleExpandSubsections(chap.id)}
                      className="w-full flex items-center justify-between px-2 py-1 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-2xs font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-blue-500" />
                        <span>{chap.subsections?.length || 0} Subsections</span>
                      </span>
                      {expandedSubsections[chap.id] ? (
                        <ChevronUp className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>

                    {/* Subsections Drawer */}
                    {expandedSubsections[chap.id] && (
                      <div className="mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-1.5 animate-in fade-in duration-150">
                        {chap.subsections && chap.subsections.length > 0 ? (
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {chap.subsections.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between text-2xs py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/80 group/sub"
                              >
                                <div className="truncate flex-1 pr-1">
                                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400 mr-1">
                                    {sub.code || '•'}
                                  </span>
                                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                                    {sub.name}
                                  </span>
                                  {sub.teluguName && (
                                    <span className="text-slate-400 text-3xs font-telugu ml-1">
                                      ({sub.teluguName})
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onDeleteSubsection && onDeleteSubsection(chap.id, sub.id)}
                                  title="Delete Subsection"
                                  className="text-slate-400 hover:text-rose-500 p-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-3xs text-slate-400 italic py-1 text-center">
                            No subsections yet. Add one below:
                          </p>
                        )}

                        {/* Inline Quick Add Subsection */}
                        <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <input
                            type="text"
                            placeholder="Add subsection / topic..."
                            value={quickSubName[chap.id] || ''}
                            onChange={(e) => setQuickSubName({ ...quickSubName, [chap.id]: e.target.value })}
                            className="flex-1 px-1.5 py-0.5 text-2xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAddSub(chap.id)}
                            title="Add Subsection"
                            className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Question Count & Action Links */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{count}</span> {count === 1 ? 'Question' : 'Questions'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigateToBuilder(chap.id)}
                      title="Add Question to this Chapter"
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectChapter(chap.id)}
                      title="View Questions in Question Bank"
                      className="flex items-center gap-0.5 text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default DashboardTab;
