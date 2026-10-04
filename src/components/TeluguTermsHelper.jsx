import React, { useState } from 'react';
import { TELUGU_MATH_PILLS } from '../data/teluguMathTerms';
import { BookOpen, Search, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';

const TeluguTermsHelper = ({ onInsert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [isExpandedAll, setIsExpandedAll] = useState(false);

  const filteredPills = TELUGU_MATH_PILLS.filter(
    p => p.label.toLowerCase().includes(filter.toLowerCase()) || p.value.includes(filter)
  );

  return (
    <div className="telugu-helper-box mb-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 overflow-hidden transition-all duration-200">
      
      {/* Toggle Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 flex items-center justify-between gap-2 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer text-left"
        title={isOpen ? 'Click to toggle OFF' : 'Click to toggle ON'}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <span>Telugu Math Terminology Helper</span>
            <span className="ml-1 text-2xs font-normal text-emerald-700 dark:text-emerald-400 font-telugu">
              (ప్రామాణిక గణిత పదకోశం)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Visual ON / OFF Toggle Pill */}
          <span
            className={`px-2 py-0.5 rounded-full text-2xs font-bold transition-all flex items-center gap-1 ${
              isOpen
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isOpen ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            <span>{isOpen ? 'ON' : 'OFF'}</span>
          </span>

          <span className="text-emerald-700 dark:text-emerald-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Expandable Content (Only rendered / visible when toggled ON) */}
      {isOpen && (
        <div className="p-3 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-2 animate-in fade-in duration-150">
          
          {/* Search bar & Show all button */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Telugu math term (e.g. శాతం, వడ్డీ, లాభం, speed)..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsExpandedAll(!isExpandedAll)}
              className="text-2xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap px-1"
            >
              {isExpandedAll ? 'Show Less ▲' : 'Show All ▼'}
            </button>
          </div>

          {/* Clickable Math Terminology Chips */}
          <div className={`flex flex-wrap gap-1.5 overflow-hidden transition-all ${isExpandedAll ? 'max-h-64 overflow-y-auto' : 'max-h-24 overflow-y-auto'}`}>
            {filteredPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onInsert(` ${pill.value} `)}
                className="px-2 py-1 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded border border-emerald-200 dark:border-emerald-800/60 transition-colors shadow-2xs active:scale-95 text-left cursor-pointer"
                title={`Click to insert "${pill.value}" into Telugu editor`}
              >
                <span className="font-telugu">{pill.label}</span>
              </button>
            ))}
          </div>

          <p className="text-2xs text-emerald-700/80 dark:text-emerald-400/80 italic">
            Click any term to insert directly at the cursor of the active text editor.
          </p>

        </div>
      )}

    </div>
  );
};

export default TeluguTermsHelper;
