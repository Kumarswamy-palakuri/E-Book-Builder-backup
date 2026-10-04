import React, { useState } from 'react';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  FolderInput,
  MoveUp,
  MoveDown,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
  Eye,
  RefreshCw,
  PlusCircle,
  Hash,
  Columns,
  Rows
} from 'lucide-react';
import MathRenderer, { getCleanSolutionText } from '../utils/mathParser';
import AdaptiveQuestionBody from './AdaptiveQuestionBody';
import { exportQuestionsToExcel, exportQuestionsToCSV, exportQuestionsToWord } from '../utils/exportImport';

const QuestionBankTab = ({
  chapters,
  questions,
  onEditQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onMoveQuestion,
  onReorderQuestion,
  onRenumberChapter,
  onBulkDelete,
  onBulkMove,
  onNavigateToBuilder,
  onClearAllQuestions,
  selectedChapterFilter = 'all',
  books = [],
  activeBookId = 'book-1'
}) => {
  const [activeChapter, setActiveChapter] = useState(selectedChapterFilter);
  const [activeSubsection, setActiveSubsection] = useState('all');
  const [activeBookFilter, setActiveBookFilter] = useState('all');
  const [activeExam, setActiveExam] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [activeDate, setActiveDate] = useState('all');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'date-desc' | 'date-asc'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkTargetChapter, setBulkTargetChapter] = useState(chapters[0]?.id || 'ch-1');
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [bankLayout, setBankLayout] = useState('two'); // 'two' | 'one'

  // Distinct exams for filter
  const examList = Array.from(new Set(questions.map(q => q.examName).filter(Boolean)));

  // Distinct exam dates for date-wise filter
  const dateList = Array.from(new Set(questions.map(q => q.examDate).filter(Boolean))).sort().reverse();

  // Filtered & Sorted questions
  const filteredQuestions = questions
    .filter(q => {
      if (activeBookFilter !== 'all') {
        const qBook = q.bookId || 'book-1';
        if (qBook !== activeBookFilter) return false;
      }
      if (activeChapter !== 'all' && q.chapterId !== activeChapter) return false;
      if (activeSubsection !== 'all' && q.subsectionId !== activeSubsection) return false;
      if (activeExam !== 'all' && q.examName !== activeExam) return false;
      if (activeDifficulty !== 'all' && q.difficulty !== activeDifficulty) return false;
      if (activeDate !== 'all' && q.examDate !== activeDate) return false;

      if (searchQuery.trim()) {
        const qText = searchQuery.toLowerCase();
        const matchEng = q.englishQuestion.toLowerCase().includes(qText);
        const matchTel = q.teluguQuestion.toLowerCase().includes(qText);
        const matchOpt = [q.optionA, q.optionB, q.optionC, q.optionD].some(o => o && o.toLowerCase().includes(qText));
        const matchExam = q.examName && q.examName.toLowerCase().includes(qText);
        const matchSol = q.solution && q.solution.toLowerCase().includes(qText);
        const matchDate = q.examDate && q.examDate.includes(qText);
        return matchEng || matchTel || matchOpt || matchExam || matchSol || matchDate;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return (b.examDate || '').localeCompare(a.examDate || '');
      }
      if (sortBy === 'date-asc') {
        return (a.examDate || '').localeCompare(b.examDate || '');
      }
      return 0; // Default chapter question number order
    });

  // Toggle selection of single question
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Toggle select all visible
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  // Bulk actions
  const handleExecuteBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} selected questions? This cannot be undone.`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleExecuteBulkMove = () => {
    if (selectedIds.size === 0) return;
    onBulkMove(Array.from(selectedIds), bulkTargetChapter);
    setSelectedIds(new Set());
  };

  const handleExportSelectedWord = () => {
    const subset = questions.filter(q => selectedIds.has(q.id));
    exportQuestionsToWord(subset.length > 0 ? subset : filteredQuestions, chapters, 'Exported_Questions.docx');
  };

  const handleExportSelectedExcel = () => {
    const subset = questions.filter(q => selectedIds.has(q.id));
    exportQuestionsToExcel(subset.length > 0 ? subset : filteredQuestions, chapters, 'Exported_Questions.xlsx');
  };

  const handleExportSelectedCSV = () => {
    const subset = questions.filter(q => selectedIds.has(q.id));
    exportQuestionsToCSV(subset.length > 0 ? subset : filteredQuestions, chapters, 'Exported_Questions.csv');
  };

  const currentChapterObj = chapters.find(c => c.id === activeChapter);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Top Header & Search / Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Question Bank</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                {filteredQuestions.length} of {questions.length} Questions
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter by chapter, reorder questions, bulk update, and export collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeChapter !== 'all' && (
              <button
                type="button"
                onClick={() => onRenumberChapter(activeChapter)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Automatically renumber this chapter questions sequentially 1, 2, 3..."
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Auto-Renumber Q#</span>
              </button>
            )}

            <button
              onClick={handleExportSelectedWord}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition-colors cursor-pointer"
              title="Export questions to Microsoft Word (.docx) with pictures beside questions"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Word (.docx) Export</span>
            </button>

            <button
              onClick={handleExportSelectedExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Export questions to Excel workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Export</span>
            </button>

            <button
              onClick={handleExportSelectedCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Export questions to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {onClearAllQuestions && questions.length > 0 && (
              <button
                type="button"
                onClick={onClearAllQuestions}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 hover:bg-red-100 transition-colors cursor-pointer"
                title="Clear all questions in the question bank"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Database</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToBuilder(activeChapter !== 'all' ? activeChapter : undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Book-Wise Filter */}
          <div>
            <select
              value={activeBookFilter}
              onChange={(e) => setActiveBookFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Books ({books.length})</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>
                  📚 {b.title} ({b.publicationDate || '2026'})
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div>
            <select
              value={activeChapter}
              onChange={(e) => {
                setActiveChapter(e.target.value);
                setActiveSubsection('all');
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="all">All Chapters ({chapters.length})</option>
              {chapters.map((chap, idx) => (
                <option key={chap.id} value={chap.id}>
                  {idx + 1}. {chap.name} ({chap.teluguName})
                </option>
              ))}
            </select>
          </div>

          {/* Subsection Filter (visible if chapter selected and has subsections) */}
          {activeChapter !== 'all' && currentChapterObj?.subsections && currentChapterObj.subsections.length > 0 && (
            <div>
              <select
                value={activeSubsection}
                onChange={(e) => setActiveSubsection(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                <option value="all">All Subsections ({currentChapterObj.subsections.length})</option>
                {currentChapterObj.subsections.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code ? `§ ${sub.code} ` : ''}{sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Exam Filter */}
          <div>
            <select
              value={activeExam}
              onChange={(e) => setActiveExam(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="all">All Exams</option>
              {examList.map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>

          {/* Date-Wise Filter */}
          <div>
            <select
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
            >
              <option value="all">All Dates ({dateList.length})</option>
              {dateList.map(date => (
                <option key={date} value={date}>📅 {date}</option>
              ))}
            </select>
          </div>

          {/* Sort By Date / Chapter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="default">Sort: Chapter Q# Order</option>
              <option value="date-desc">Sort: Exam Date (Newest)</option>
              <option value="date-asc">Sort: Exam Date (Oldest)</option>
            </select>
          </div>

        </div>

        {/* Bulk Action Bar (Visible when items selected) */}
        {selectedIds.size > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>{selectedIds.size} questions selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-slate-600 dark:text-slate-400">Move to:</span>
                <select
                  value={bulkTargetChapter}
                  onChange={(e) => setBulkTargetChapter(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                >
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleExecuteBulkMove}
                  className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Move
                </button>
              </div>

              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Questions List Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
          >
            {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All Visible ({filteredQuestions.length})</span>
          </button>

          {/* 2-Columns vs 1-Column Layout Switch */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-2xs font-semibold">
            <button
              type="button"
              onClick={() => setBankLayout('two')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all cursor-pointer ${bankLayout === 'two'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              title="Display questions in 2 columns"
            >
              <Columns className="w-3 h-3" />
              <span>2 Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setBankLayout('one')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all cursor-pointer ${bankLayout === 'one'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              title="Display questions in 1 column"
            >
              <Rows className="w-3 h-3" />
              <span>1 Column</span>
            </button>
          </div>
        </div>

        {activeChapter !== 'all' && currentChapterObj && (
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Showing questions in Chapter: {currentChapterObj.name} {currentChapterObj.teluguName && <span className="font-telugu font-bold">({currentChapterObj.teluguName})</span>}
          </span>
        )}
      </div>

      {/* Questions Cards List */}
      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No questions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or chapter filter, or click below to add your first question.
          </p>
          <button
            onClick={() => onNavigateToBuilder(activeChapter !== 'all' ? activeChapter : undefined)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            + Create Question
          </button>
        </div>
      ) : (
        <div className={bankLayout === 'two' ? "grid grid-cols-1 lg:grid-cols-2 gap-3.5" : "space-y-3"}>
          {filteredQuestions.map((q, idx) => {
            const chap = chapters.find(c => c.id === q.chapterId) || { name: 'Unknown', teluguName: '' };
            const book = books.find(b => b.id === (q.bookId || 'book-1'));
            const isSelected = selectedIds.has(q.id);

            return (
              <div
                key={q.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-4 transition-all shadow-2xs ${isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">

                  {/* Left: Checkbox & Question Content */}
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelect(q.id)}
                      className="mt-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-2 flex-1">

                      {/* Tags & Metadata Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-2xs font-bold font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          Q#{q.questionNumber}
                        </span>
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {chap.name}
                        </span>
                        {book && (
                          <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                            📚 {book.title.length > 22 ? book.title.substring(0, 22) + '...' : book.title}
                          </span>
                        )}
                        <span className="text-2xs font-mono font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          {q.examName} • 📅 {q.examDate} • {q.shift}
                        </span>
                        <span className={`text-2xs px-1.5 py-0.5 rounded font-semibold ${q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                            q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700' :
                              'bg-amber-50 text-amber-700'
                          }`}>
                          {q.difficulty}
                        </span>
                        {(q.subsectionId || q.topic) && (
                          <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 flex items-center gap-1">
                            <span>§</span>
                            <span>
                              {chap.subsections?.find(s => s.id === q.subsectionId)?.code ? `[${chap.subsections?.find(s => s.id === q.subsectionId)?.code}] ` : ''}
                              {chap.subsections?.find(s => s.id === q.subsectionId)?.name || q.topic}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Adaptive Question Body: fits into text div if aspect ratio is wide */}
                      <AdaptiveQuestionBody
                        englishQuestion={q.englishQuestion}
                        teluguQuestion={q.teluguQuestion}
                        imageUrl={q.imageUrl}
                      />

                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        {[
                          { key: 'A', val: q.optionA },
                          { key: 'B', val: q.optionB },
                          { key: 'C', val: q.optionC },
                          { key: 'D', val: q.optionD },
                        ].map(opt => {
                          const isCorrect = q.correctAnswer === opt.key;
                          return (
                            <div
                              key={opt.key}
                              className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                              <span className={`text-2xs font-bold ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
                                ({opt.key.toLowerCase()})
                              </span>
                              <div className="truncate">
                                <MathRenderer text={opt.val} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Snippet */}
                      {((q.solution && q.solution.trim()) || q.solutionImageUrl) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-2xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg leading-relaxed">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5 text-3xs uppercase tracking-wider">
                            💡 Solution / Explanation:
                          </span>
                          {q.solution && (
                            <div className="font-mono">
                              <MathRenderer text={getCleanSolutionText(q.solution, q.solutionImageUrl)} />
                            </div>
                          )}
                          {q.solutionImageUrl && (
                            <div className="mt-2 flex items-center justify-center max-w-full overflow-hidden">
                              <img
                                src={q.solutionImageUrl}
                                alt="Solution Diagram"
                                className="max-h-28 w-auto max-w-full h-auto object-contain rounded border border-slate-200 dark:border-slate-700 bg-white p-0.5"
                                style={{ maxWidth: '100%', objectFit: 'contain' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Right: Actions Column */}
                  <div className="flex flex-col sm:flex-row items-center gap-1">

                    {/* Reorder Buttons */}
                    <div className="flex sm:flex-col items-center gap-0.5 mr-1">
                      <button
                        type="button"
                        onClick={() => onReorderQuestion(q.id, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded disabled:opacity-20 cursor-pointer"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderQuestion(q.id, 'down')}
                        disabled={idx === filteredQuestions.length - 1}
                        title="Move Down"
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded disabled:opacity-20 cursor-pointer"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => onEditQuestion(q)}
                      title="Edit Question"
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Duplicate Button */}
                    <button
                      type="button"
                      onClick={() => onDuplicateQuestion(q)}
                      title="Duplicate Question"
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete Question #${q.questionNumber}?`)) {
                          onDeleteQuestion(q.id);
                        }
                      }}
                      title="Delete Question"
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 text-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default QuestionBankTab;
