import React, { useState } from 'react';
import {
  BookOpen,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Filter,
  CheckCircle2,
  Layers,
  FileCheck,
  FileText,
  KeyRound,
  RotateCcw,
  Sparkles,
  Columns,
  Rows
} from 'lucide-react';
import BookRenderer from '../pdf/BookRenderer';

const PdfStudioTab = ({
  settings,
  chapters,
  questions,
  onOpenSettings,
  books = [],
  activeBookId = 'book-1',
  onSelectBook,
  onUpdateSettings
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'answers_only' | 'solutions_only'
  const [columnsLayout, setColumnsLayout] = useState('one'); // 'one' | 'two'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Trigger high-fidelity vector print engine
  const handlePrintOrDownload = () => {
    window.print();
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 60));
  const handleZoomReset = () => setZoomLevel(100);

  // Determine current title for UI
  const currentChapterObj = chapters.find(c => c.id === selectedChapterId);

  return (
    <div className={`space-y-4 animate-in fade-in duration-200 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 overflow-y-auto' : ''}`}>

      {/* Top Toolbar (Non-printable) */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 flex flex-wrap items-center justify-between gap-4">

        {/* Left: View Controls */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Chapter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Scope:
            </span>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Complete Book (All Chapters)</option>
              {chapters.map((chap, idx) => (
                <option key={chap.id} value={chap.id}>
                  Ch-{idx + 1}: {chap.name} ({chap.teluguName})
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-2xs font-semibold">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'}`}
            >
              Full Book
            </button>
            <button
              onClick={() => setViewMode('answers_only')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'answers_only' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'}`}
            >
              Answer Keys Only
            </button>
            <button
              onClick={() => setViewMode('solutions_only')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'solutions_only' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'}`}
            >
              Solutions Only
            </button>
          </div>

          {/* Column Layout Switcher (1 Column vs 2 Columns) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-2xs font-semibold">
            <button
              onClick={() => setColumnsLayout('one')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${columnsLayout === 'one'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              title="Single Column Layout"
            >
              <Rows className="w-3.5 h-3.5" />
              <span>1 Column</span>
            </button>
            <button
              onClick={() => setColumnsLayout('two')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${columnsLayout === 'two'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              title="Two Columns Layout (Word / Exam Book Style)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>2 Columns</span>
            </button>
          </div>

          {/* Two-Column Image Position Selector (shown when 2 Columns is active) */}
          {columnsLayout === 'two' && onUpdateSettings && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-2xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400 whitespace-nowrap">Image:</span>
              <select
                value={settings.twoColumnImageLayout || 'after_questions'}
                onChange={(e) => onUpdateSettings({ twoColumnImageLayout: e.target.value })}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-0.5 text-2xs font-semibold cursor-pointer shadow-2xs"
                title="Choose where image appears in 2-column view"
              >
                <option value="after_questions">After Both Questions (English & Telugu)</option>
                <option value="between_languages">Between English & Telugu</option>
              </select>
            </div>
          )}

          {/* Quick Solutions Controls */}
          {onUpdateSettings && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-2xs font-semibold">
              <button
                type="button"
                onClick={() => onUpdateSettings({ includeSolutions: settings.includeSolutions === false ? true : false })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  settings.includeSolutions !== false
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Toggle chapter solutions & explanations at the end of each chapter"
              >
                <span>Solutions Section {settings.includeSolutions !== false ? '✓' : '(Off)'}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ includeInlineSolutions: !settings.includeInlineSolutions })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  settings.includeInlineSolutions
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Display explanation box directly under each question in the PDF"
              >
                <span>Inline Explanations {settings.includeInlineSolutions ? '✓' : ''}</span>
              </button>
            </div>
          )}

        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="px-2 py-1 text-2xs font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            title="Reset Zoom"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Book Reader'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            Format & Style Settings
          </button>

          <button
            onClick={handlePrintOrDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </button>
        </div>

      </div>

      {/* Chapter-Specific Quick Export Bar (Non-printable) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 px-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>
            Previewing: <b>{selectedChapterId === 'all' ? 'Complete Book' : currentChapterObj?.name}</b> • {questions.length} total questions in database
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedChapterId !== 'all' ? (
            <button
              onClick={handlePrintOrDownload}
              className="text-2xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              DOWNLOAD CURRENT CHAPTER PDF
            </button>
          ) : (
            <button
              onClick={handlePrintOrDownload}
              className="text-2xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              DOWNLOAD COMPLETE BOOK PDF
            </button>
          )}
          <span className="text-slate-300">|</span>
          <button
            onClick={() => {
              setViewMode('answers_only');
              setTimeout(handlePrintOrDownload, 100);
            }}
            className="text-2xs font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
          >
            DOWNLOAD ANSWER KEY ONLY
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => {
              setViewMode('solutions_only');
              setTimeout(handlePrintOrDownload, 100);
            }}
            className="text-2xs font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
          >
            DOWNLOAD SOLUTIONS ONLY
          </button>
        </div>
      </div>

      {/* A4 Book Preview Container */}
      <div className="flex justify-center bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-8 rounded-2xl overflow-x-auto">
        <div
          className="preview-zoom-wrapper transition-transform origin-top shadow-2xl rounded-lg overflow-hidden"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            width: '210mm',
            minHeight: '297mm'
          }}
        >
          <BookRenderer
            settings={settings}
            chapters={chapters}
            questions={questions}
            filterChapterId={selectedChapterId === 'all' ? null : selectedChapterId}
            filterMode={viewMode}
            columnsLayout={columnsLayout}
          />
        </div>
      </div>

    </div>
  );
};

export default PdfStudioTab;
