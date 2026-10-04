import React from 'react';

export const MATH_SNIPPETS = [
  { label: 'x²', insert: 'x^2', tooltip: 'Square' },
  { label: 'x³', insert: 'x^3', tooltip: 'Cube' },
  { label: 'xⁿ', insert: 'x^{n}', tooltip: 'Superscript' },
  { label: 'xₙ', insert: 'x_{n}', tooltip: 'Subscript' },
  { label: '√x', insert: '\\sqrt{x}', tooltip: 'Square Root' },
  { label: '∛x', insert: '\\sqrt[3]{x}', tooltip: 'Cube Root' },
  { label: 'a/b', insert: '\\frac{a}{b}', tooltip: 'Fraction' },
  { label: '16⅔%', insert: '16\\frac{2}{3}\\%', tooltip: 'Mixed Fraction %' },
  { label: '%', insert: '%', tooltip: 'Percentage' },
  { label: '₹', insert: '₹', tooltip: 'Rupees Symbol' },
  { label: ':', insert: ' : ', tooltip: 'Ratio' },
  { label: '::', insert: ' :: ', tooltip: 'Proportion' },
  { label: 'π', insert: '\\pi', tooltip: 'Pi' },
  { label: '°', insert: '^\\circ', tooltip: 'Degree' },
  { label: '±', insert: '\\pm', tooltip: 'Plus-Minus' },
  { label: '×', insert: '\\times', tooltip: 'Multiply' },
  { label: '÷', insert: '\\div', tooltip: 'Divide' },
  { label: '≤', insert: '\\le', tooltip: 'Less than equal' },
  { label: '≥', insert: '\\ge', tooltip: 'Greater than equal' },
  { label: '≠', insert: '\\neq', tooltip: 'Not equal' },
  { label: 'θ', insert: '\\theta', tooltip: 'Theta' },
  { label: 'α', insert: '\\alpha', tooltip: 'Alpha' },
  { label: 'β', insert: '\\beta', tooltip: 'Beta' },
  { label: 'Δ', insert: '\\Delta ', tooltip: 'Delta' },
  { label: '△', insert: '\\triangle ', tooltip: 'Triangle' },
  { label: '∠', insert: '\\angle ', tooltip: 'Angle' },
  { label: '⊙', insert: '\\odot ', tooltip: 'Circle with dot' },
  { label: '○', insert: '\\bigcirc ', tooltip: 'Circle' },
  { label: '⟂', insert: '\\perp ', tooltip: 'Perpendicular' },
  { label: '∼', insert: '\\sim ', tooltip: 'Similar to' },
  { label: '≅', insert: '\\cong ', tooltip: 'Congruent to' },
  { label: 'Σ', insert: '\\Sigma', tooltip: 'Summation / Sigma' },
  { label: 'sin θ', insert: '\\sin\\theta', tooltip: 'Sine' },
  { label: 'cos θ', insert: '\\cos\\theta', tooltip: 'Cosine' },
  { label: 'tan θ', insert: '\\tan\\theta', tooltip: 'Tangent' }
];

const MathToolbar = ({ onInsert, label = 'Math Quick Insert' }) => {
  return (
    <div className="math-toolbar flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 mb-2">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        {label}:
      </span>
      {MATH_SNIPPETS.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onInsert(item.insert)}
          title={item.tooltip}
          className="px-2 py-0.5 text-xs font-mono font-medium bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded border border-slate-200 dark:border-slate-600 transition-colors shadow-xs active:scale-95"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default MathToolbar;
