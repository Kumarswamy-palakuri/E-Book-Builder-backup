import React, { useState } from 'react';
import { X, Sliders, Check, Book, Palette, Layout, FileText, Tag } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, settings, onSaveSettings }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    includeExamDetails: true,
    showExamName: true,
    showExamDate: true,
    showExamShift: true,
    examName: 'RRB Technician',
    examDate: '2026-03-09',
    shift: 'Shift-02',
    applyExamDetailsToAll: false,
    includeInlineAnswers: false,
    includeInlineSolutions: false,
    ...settings
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                PDF Book & Publication Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize book headers, cover page styling, layout rules, and publication metadata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Section: Book Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Book className="w-4 h-4" /> Book Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Book Main Title
                </label>
                <input
                  type="text"
                  value={formData.bookTitle}
                  onChange={(e) => handleChange('bookTitle', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Edition / Year
                </label>
                <input
                  type="text"
                  value={formData.editionYear}
                  onChange={(e) => handleChange('editionYear', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subtitle / Description
              </label>
              <input
                type="text"
                value={formData.bookSubtitle}
                onChange={(e) => handleChange('bookSubtitle', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Author / Faculty Panel
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => handleChange('authorName', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institute / Publication Name
                </label>
                <input
                  type="text"
                  value={formData.instituteName}
                  onChange={(e) => handleChange('instituteName', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Exam Badges (Cover page)
              </label>
              <input
                type="text"
                value={formData.examCategory}
                onChange={(e) => handleChange('examCategory', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: Visual Style & Theme */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Palette className="w-4 h-4" /> Cover Theme & Design
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'navy-gold', label: 'Navy & Gold', color: 'from-slate-900 via-blue-950 to-indigo-950 text-amber-400' },
                { id: 'royal-blue', label: 'Royal Blue', color: 'from-blue-900 to-indigo-900 text-cyan-300' },
                { id: 'crimson', label: 'Crimson & Slate', color: 'from-red-950 via-rose-900 to-slate-900 text-rose-300' },
                { id: 'emerald', label: 'Emerald Green', color: 'from-emerald-950 to-teal-900 text-emerald-300' },
              ].map(theme => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => handleChange('coverTheme', theme.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${formData.coverTheme === theme.id
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <div className={`h-8 rounded-md bg-gradient-to-r ${theme.color} mb-1.5 flex items-center justify-center text-xs font-bold`}>
                    {formData.coverTheme === theme.id && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{theme.label}</div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: Layout & Page Sections */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Layout className="w-4 h-4" /> Layout Rules & Sections Included
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Option Layout Engine
                </label>
                <select
                  value={formData.optionLayout}
                  onChange={(e) => handleChange('optionLayout', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="auto">Smart Auto-Detect (2x2 grid or stacked based on length)</option>
                  <option value="grid-2x2">Force 2x2 Block Grid (a & b, c & d)</option>
                  <option value="stacked">Always Stacked (1-column per option)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Font Sizing
                </label>
                <select
                  value={formData.fontSize}
                  onChange={(e) => handleChange('fontSize', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="compact">Compact (Dense questions per page)</option>
                  <option value="standard">Standard (Recommended exam book size)</option>
                  <option value="comfortable">Comfortable (Larger text & spacing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Two-Column View Image Position
                </label>
                <select
                  value={formData.twoColumnImageLayout || 'after_questions'}
                  onChange={(e) => handleChange('twoColumnImageLayout', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="after_questions">After Both Questions (English & Telugu)</option>
                  <option value="between_languages">Between English and Telugu</option>
                </select>
              </div>
            </div>

            {/* Inclusions Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { key: 'includeCover', label: 'Cover Page' },
                { key: 'includeIndex', label: 'Book Index' },
                { key: 'includeAnswerKey', label: 'Answer Keys' },
                { key: 'includeSolutions', label: 'Chapter Solutions' },
                { key: 'includeExamDetails', label: 'Exam Tag on Qs' },
                { key: 'includeInlineAnswers', label: 'Inline Answers' },
                { key: 'includeInlineSolutions', label: 'Inline Explanations' },
              ].map(item => (
                <label
                  key={item.key}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${formData[item.key]
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={formData[item.key]}
                    onChange={(e) => handleChange(item.key, e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{item.label}</span>
                </label>
              ))}
            </div>

            {/* Header & Footer Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Running Header Text (Top of every page)
                </label>
                <input
                  type="text"
                  value={formData.headerText}
                  onChange={(e) => handleChange('headerText', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Footer Notice (Bottom of every page)
                </label>
                <input
                  type="text"
                  value={formData.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: Exam Details & Metadata (Question Badges) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Exam Details & Question Badge
              </h4>
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeExamDetails}
                  onChange={(e) => handleChange('includeExamDetails', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Show on PDF Questions</span>
              </label>
            </div>

            <p className="text-2xs text-slate-500 dark:text-slate-400">
              Configure exam name, exam date, and shift settings for the final PDF (matches the preview in the edit question page).
            </p>

            {formData.includeExamDetails && (
              <div className="space-y-3 bg-slate-50/90 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                {/* Element Inclusion Toggles */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="text-2xs font-bold uppercase text-slate-500">Include:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showExamName}
                      onChange={(e) => handleChange('showExamName', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Exam Name</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showExamDate}
                      onChange={(e) => handleChange('showExamDate', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Exam Date</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showExamShift}
                      onChange={(e) => handleChange('showExamShift', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Shift</span>
                  </label>
                </div>

                {/* Exam Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RRB Technician"
                      value={formData.examName || ''}
                      onChange={(e) => handleChange('examName', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={formData.examDate || ''}
                      onChange={(e) => handleChange('examDate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Exam Shift
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shift-02"
                      value={formData.shift || ''}
                      onChange={(e) => handleChange('shift', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Application Mode */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <span className="text-2xs font-bold uppercase text-slate-500">Apply:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="applyMode"
                      checked={!formData.applyExamDetailsToAll}
                      onChange={() => handleChange('applyExamDetailsToAll', false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Use question's details (use above as fallback)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="applyMode"
                      checked={!!formData.applyExamDetailsToAll}
                      onChange={() => handleChange('applyExamDetailsToAll', true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Override all questions with above details</span>
                  </label>
                </div>

                {/* Live Realistic Preview matching Edit Question page */}
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-2xs font-semibold text-slate-500 dark:text-slate-400">
                    Question Badge Preview (as rendered in PDF):
                  </span>
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-block text-2xs font-mono font-medium px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-600">
                      {[
                        formData.showExamName && (formData.examName || 'Exam'),
                        formData.showExamDate && (formData.examDate || '2026-03-09'),
                        formData.showExamShift && (formData.shift || 'Shift-02')
                      ].filter(Boolean).join(' | ') || 'No Elements Selected'}
                    </span>
                    {formData.includeInlineAnswers && (
                      <span className="text-2xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                        Ans: (b)
                      </span>
                    )}
                  </div>
                  {formData.includeInlineSolutions && (
                    <div className="mt-2 text-3xs font-mono text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-slate-800/80 p-2 rounded border border-blue-200 dark:border-slate-700">
                      <span className="font-bold text-blue-600 block mb-0.5">Explanation:</span>
                      Formula: 20% of 500 = (20/100) * 500 = 100.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Book Settings
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default SettingsModal;
