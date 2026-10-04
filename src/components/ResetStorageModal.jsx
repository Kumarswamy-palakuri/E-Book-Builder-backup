import React from 'react';
import { Trash2, AlertTriangle, X, DatabaseZap, RefreshCw } from 'lucide-react';

const ResetStorageModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions = 0
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-rose-300 dark:border-rose-900/60 overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="bg-rose-50 dark:bg-rose-950/40 p-4 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Local Storage & Reset Data
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                Clear all questions and restart testing with a clean slate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Warning: This action is permanent!</span>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                All saved questions, drafts, book configurations, and customized chapters stored in your browser will be purged.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              What will be removed:
            </p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>
                  <strong>All {totalQuestions} Questions:</strong> Question Bank will be completely emptied.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>
                  <strong>Question Builder Drafts:</strong> In-progress question forms will be cleared.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>
                  <strong>Browser Local Storage:</strong> All cache, settings, and book editions will be restored to defaults.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-black text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete All Data</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResetStorageModal;
