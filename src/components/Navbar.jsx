import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Database,
  FileSpreadsheet,
  BookOpen,
  BookMarked,
  ChevronDown,
  Settings,
  Moon,
  Sun,
  FileDown,
  Trash2
} from 'lucide-react';

const Navbar = ({
  activeTab,
  setActiveTab,
  totalQuestions,
  totalChapters,
  isDarkMode,
  setIsDarkMode,
  onOpenSettings,
  onQuickGeneratePDF,
  books = [],
  activeBookId = 'book-1',
  onSelectBook,
  onDeleteLocalStorage
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'builder', label: 'Question Builder', icon: PlusCircle, highlight: true },
    { id: 'bank', label: 'Question Bank', icon: Database, badge: totalQuestions },
    { id: 'bulk', label: 'Bulk Import', icon: FileSpreadsheet },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  ExamMCQ <span className="text-blue-600 dark:text-blue-400 font-normal">Maker</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-2xs font-bold uppercase rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  Bilingual PDF Engine
                </span>
              </div>
              <p className="hidden sm:block text-2xs text-slate-500 dark:text-slate-400 leading-tight">
                Railway • SSC • Banking Mathematics Book Generator
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? 'text-blue-500' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-2xs ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Delete Local Storage Button (Replaced PDF Book Studio) */}
            <button
              type="button"
              onClick={onDeleteLocalStorage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer"
              title="Delete Local Storage & Clear All Questions to Restart Testing"
            >
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Delete Local Storage</span>
            </button>
          </nav>

          {/* Action Tools: PDF Quick Trigger, Settings, Dark Mode */}
          <div className="flex items-center gap-2 shrink-0">
            {books && books.length > 0 && onSelectBook && (
              <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg">
                <BookMarked className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="relative flex items-center">
                  <select
                    value={activeBookId}
                    onChange={(e) => onSelectBook(e.target.value)}
                    className="text-2xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer pr-3.5 max-w-[130px] truncate appearance-none"
                    title="Active Book Edition"
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">
                        {b.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </div>
            )}

            <button
              onClick={onQuickGeneratePDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              title="Open PDF Studio & Generate PDF Book"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">GENERATE PDF</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Book Publication Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 text-2xs font-medium cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onDeleteLocalStorage}
            className="flex flex-col items-center gap-0.5 text-2xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
            title="Delete Local Storage & Clear All Questions"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
