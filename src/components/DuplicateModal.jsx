import React from 'react';
import { AlertTriangle, X, Check, Copy, RefreshCw } from 'lucide-react';
import MathRenderer from '../utils/mathParser';
import AdaptiveQuestionBody from './AdaptiveQuestionBody';

const DuplicateModal = ({
  isOpen,
  duplicateData,
  newQuestion,
  onKeepBoth,
  onReplaceExisting,
  onCancel
}) => {
  if (!isOpen || !duplicateData) return null;

  const { match: existing, similarityScore } = duplicateData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-amber-300 dark:border-amber-600/40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-950/40 p-4 border-b border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Possible Duplicate Found
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                A similar question was found in this chapter ({similarityScore}% similarity match)
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Existing Question */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Existing Question (Q#{existing.questionNumber})
                </span>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                  {existing.examName || 'Exam'}
                </span>
              </div>
              <div className="mb-3">
                <AdaptiveQuestionBody
                  englishQuestion={existing.englishQuestion}
                  teluguQuestion={existing.teluguQuestion}
                  imageUrl={existing.imageUrl}
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div>(a) {existing.optionA}</div>
                <div>(b) {existing.optionB}</div>
                <div>(c) {existing.optionC}</div>
                <div>(d) {existing.optionD}</div>
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Answer: Option {existing.correctAnswer}
              </div>
            </div>

            {/* New Question */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  New Question (To Add)
                </span>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-medium">
                  {newQuestion.examName || 'New'}
                </span>
              </div>
              <div className="mb-3">
                <AdaptiveQuestionBody
                  englishQuestion={newQuestion.englishQuestion}
                  teluguQuestion={newQuestion.teluguQuestion}
                  imageUrl={newQuestion.imageUrl}
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div>(a) {newQuestion.optionA}</div>
                <div>(b) {newQuestion.optionB}</div>
                <div>(c) {newQuestion.optionC}</div>
                <div>(d) {newQuestion.optionD}</div>
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Answer: Option {newQuestion.correctAnswer}
              </div>
            </div>

          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/30">
            How would you like to proceed with this question? You can keep both questions, overwrite the existing one with this updated version, or cancel.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onReplaceExisting}
            className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace Existing
          </button>
          <button
            type="button"
            onClick={onKeepBoth}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Keep Both (Add as New)
          </button>
        </div>

      </div>
    </div>
  );
};

export default DuplicateModal;
