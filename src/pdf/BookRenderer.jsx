import React from 'react';
import MathRenderer, { hasFractionsOrMath, getCleanSolutionText } from '../utils/mathParser';
import AdaptiveQuestionBody from '../components/AdaptiveQuestionBody';

/**
 * A4 Printable Competitive Exam Book Renderer
 */
export const BookRenderer = ({
  settings,
  chapters,
  questions,
  filterChapterId = null, // null means all chapters (Complete Book)
  filterMode = 'all', // 'all' | 'chapter' | 'answers_only' | 'solutions_only'
  id = 'printable-book',
  columnsLayout = 'one' // 'one' | 'two'
}) => {
  // Filter chapters based on active mode
  const displayedChapters = filterChapterId
    ? chapters.filter(c => c.id === filterChapterId)
    : chapters;

  // Group questions by chapter
  const questionsByChapter = {};
  questions.forEach(q => {
    if (!questionsByChapter[q.chapterId]) {
      questionsByChapter[q.chapterId] = [];
    }
    questionsByChapter[q.chapterId].push(q);
  });

  // Only include chapters that have questions (unless user selected that chapter)
  const activeChapters = displayedChapters.filter(c =>
    (questionsByChapter[c.id] && questionsByChapter[c.id].length > 0) || filterChapterId === c.id
  );

  const isAnswersOnly = filterMode === 'answers_only';
  const isSolutionsOnly = filterMode === 'solutions_only';

  return (
    <div id={id} className="printable-book bg-white text-slate-900 font-sans">

      {/* 1. COVER PAGE (Only if complete book or enabled in settings and not answers/solutions only) */}
      {settings.includeCover && !filterChapterId && !isAnswersOnly && !isSolutionsOnly && (
        <div className="book-page cover-page flex flex-col justify-between p-12 text-white bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 min-h-[1050px] relative overflow-hidden">

          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          {/* Top Organization Header */}
          <div className="relative z-10 border-b border-blue-400/30 pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-amber-400">
                {settings.instituteName}
              </span>
              <p className="text-2xs text-slate-300 font-medium">
                Official Competitive Exam Publication Series
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/40">
              {settings.editionYear}
            </span>
          </div>

          {/* Book Title & Badges */}
          <div className="relative z-10 my-auto text-center space-y-6">

            {/* Exam Target Badges */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
              {settings.examCategory.split('|').map((badge, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-2xs font-bold uppercase rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-xs"
                >
                  {badge.trim()}
                </span>
              ))}
            </div>

            {/* Main Title */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight uppercase">
                {settings.bookTitle}
              </h1>
              <div className="w-24 h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full"></div>
              <p className="text-base md:text-lg font-medium text-slate-200 max-w-xl mx-auto leading-relaxed">
                {settings.bookSubtitle}
              </p>
            </div>

            {/* Bilingual Feature Highlights */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-6 text-center text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-amber-400">Bilingual</div>
                <div className="text-2xs text-slate-300 font-telugu">ఇంగ్లీష్ & తెలుగు</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-amber-400">Chapter-Wise</div>
                <div className="text-2xs text-slate-300">29 Exam Topics</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-amber-400">Solutions</div>
                <div className="text-2xs text-slate-300">With Answer Keys</div>
              </div>
            </div>

          </div>

          {/* Bottom Authors & Footer */}
          <div className="relative z-10 border-t border-blue-400/30 pt-4 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="font-bold text-white uppercase">{settings.authorName}</span>
              <p className="text-2xs text-slate-400">Senior Mathematics Faculty</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">VICTORY EXAM EDITIONS</p>
              <p className="text-2xs text-slate-400">Strictly Based on Latest TCS Exam Pattern</p>
            </div>
          </div>

        </div>
      )}

      {/* 2. TABLE OF CONTENTS / INDEX */}
      {settings.includeIndex && !filterChapterId && !isAnswersOnly && !isSolutionsOnly && (
        <div className="book-page p-10 min-h-[1050px] flex flex-col justify-between border-b border-slate-200">
          <div>
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
                  Table of Contents <span className="font-telugu text-base font-bold">(విషయ సూచిక)</span>
                </h2>
                <p className="text-2xs text-slate-500 font-medium">
                  {settings.bookTitle} • Chapter Organization
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                Index
              </span>
            </div>

            {/* Two-Column Chapters Index List */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
              {chapters.map((chap, idx) => {
                const count = (questionsByChapter[chap.id] || []).length;
                return (
                  <div
                    key={chap.id}
                    className="flex items-baseline justify-between py-1 border-b border-dotted border-slate-300"
                  >
                    <div className="flex items-baseline gap-2 truncate pr-2">
                      <span className="font-bold font-mono text-slate-600 min-w-[22px]">
                        {idx + 1}.
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {chap.name}
                      </span>
                      <span className="text-slate-500 font-telugu text-2xs truncate">
                        ({chap.teluguName})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 text-2xs whitespace-nowrap">
                      {count > 0 ? `${count} Qs` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-2xs text-slate-500 flex justify-between">
            <span>{settings.footerText}</span>
            <span>Index Page</span>
          </div>
        </div>
      )}

      {/* 3. CHAPTERS & QUESTIONS */}
      {activeChapters.map((chap, chapIndex) => {
        const chapQuestions = questionsByChapter[chap.id] || [];

        return (
          <div key={chap.id} className="chapter-container">

            {/* If NOT answer-key only or solutions-only, render questions */}
            {!isAnswersOnly && !isSolutionsOnly && (
              <div className="chapter-questions-block">

                {/* Chapter Banner Header */}
                <div className="chapter-header-banner p-4 mb-4 bg-slate-900 text-white rounded-lg flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-2xs font-bold uppercase tracking-widest text-amber-400">
                      CHAPTER {chapIndex + 1}
                    </span>
                    <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight">
                      {chap.name}
                    </h2>
                    <p className="text-xs text-slate-300 font-telugu">
                      {chap.teluguName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-600 text-white">
                      {chapQuestions.length} Questions
                    </span>
                  </div>
                </div>

                {/* Questions Grid / List (1 Column or 2 Columns) */}
                <div className={columnsLayout === 'two' ? "questions-two-columns" : "space-y-4"}>
                  {chapQuestions.map((q) => {
                    const isLongOpts =
                      columnsLayout === 'two'
                        ? (q.optionA.length > 18 || q.optionB.length > 18 || q.optionC.length > 18 || q.optionD.length > 18)
                        : (q.optionA.length > 28 || q.optionB.length > 28 || q.optionC.length > 28 || q.optionD.length > 28);

                    const layout = settings.optionLayout === 'stacked' || (settings.optionLayout === 'auto' && isLongOpts)
                      ? 'stacked'
                      : 'grid';

                    const effectiveExamName = settings.applyExamDetailsToAll
                      ? (settings.examName || q.examName)
                      : (q.examName || settings.examName);

                    const effectiveExamDate = settings.applyExamDetailsToAll
                      ? (settings.examDate || q.examDate)
                      : (q.examDate || settings.examDate);

                    const effectiveShift = settings.applyExamDetailsToAll
                      ? (settings.shift || q.shift)
                      : (q.shift || settings.shift);

                    const badgeParts = [];
                    if (settings.showExamName !== false && effectiveExamName) {
                      badgeParts.push(effectiveExamName);
                    }
                    if (settings.showExamDate !== false && effectiveExamDate) {
                      badgeParts.push(effectiveExamDate);
                    }
                    if (settings.showExamShift !== false && effectiveShift) {
                      badgeParts.push(effectiveShift);
                    }
                    const badgeText = badgeParts.join(' | ');
                    const showExamBadge = settings.includeExamDetails !== false && badgeText;
                    const hasMath = hasFractionsOrMath(q);

                    const isTwoColumn = columnsLayout === 'two';
                    const twoColImgPos = settings.twoColumnImageLayout || 'after_questions';

                    return (
                      <div
                        key={q.id}
                        className={`question-card break-inside-avoid page-break-inside-avoid p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-2 ${hasMath ? 'has-math-fractions' : ''}`}
                      >
                        {/* Adaptive Question Body: fits into text div if aspect ratio is wide */}
                        <AdaptiveQuestionBody
                          englishQuestion={q.englishQuestion}
                          teluguQuestion={q.teluguQuestion}
                          imageUrl={q.imageUrl}
                          questionNumber={q.questionNumber}
                          hasMath={hasMath}
                          isTwoColumn={isTwoColumn}
                          twoColImgPos={twoColImgPos}
                          questionNumberColor="text-blue-700"
                        />

                        {/* Extra blank space below question if it contains fractions or mathematical expressions */}
                        {hasMath && <div className="h-1.5 w-full" aria-hidden="true" />}

                        {/* Options */}
                        <div className="pt-1 pl-5">
                          {layout === 'stacked' ? (
                            <div className={`text-xs text-slate-800 ${hasMath ? 'space-y-2' : 'space-y-1'}`}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-500">(a)</span>
                                <MathRenderer text={q.optionA} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-500">(b)</span>
                                <MathRenderer text={q.optionB} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-500">(c)</span>
                                <MathRenderer text={q.optionC} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-500">(d)</span>
                                <MathRenderer text={q.optionD} />
                              </div>
                            </div>
                          ) : (
                            <div className={`grid grid-cols-2 gap-x-6 text-xs text-slate-800 ${hasMath ? 'gap-y-2.5' : 'gap-y-1'}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">(a)</span>
                                <MathRenderer text={q.optionA} />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">(b)</span>
                                <MathRenderer text={q.optionB} />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">(c)</span>
                                <MathRenderer text={q.optionC} />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">(d)</span>
                                <MathRenderer text={q.optionD} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Exam Tag Badge & Inline Answer / Explanation */}
                        {(showExamBadge || (settings.includeInlineAnswers && q.correctAnswer) || (settings.includeInlineSolutions && q.solution)) && (
                          <div className="pt-3.5 mt-2 pl-5 space-y-2 text-2xs">
                            <div className="flex items-center justify-between">
                              {showExamBadge ? (
                                <span className="inline-block text-2xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                                  {badgeText}
                                </span>
                              ) : <span />}

                              {settings.includeInlineAnswers && q.correctAnswer && (
                                <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Ans: ({q.correctAnswer.toLowerCase()})
                                </span>
                              )}
                            </div>

                            {/* Optional Inline Explanation */}
                            {settings.includeInlineSolutions && (q.solution || q.solutionImageUrl) && (
                              <div className="text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed bg-blue-50/40 p-2.5 rounded-lg border border-blue-100">
                                <span className="font-bold text-blue-700 block mb-0.5">Explanation:</span>
                                {q.solution && <MathRenderer text={getCleanSolutionText(q.solution, q.solutionImageUrl)} />}
                                {q.solutionImageUrl && (
                                  <div className="mt-1 text-center max-w-full overflow-hidden">
                                    <img
                                      src={q.solutionImageUrl}
                                      alt="Solution Diagram"
                                      className="max-h-32 max-w-full w-auto h-auto object-contain rounded border border-slate-200 bg-white p-0.5 inline-block"
                                      style={{ maxWidth: '100%', objectFit: 'contain' }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* 4. CHAPTER ANSWER KEY */}
            {settings.includeAnswerKey && !isSolutionsOnly && chapQuestions.length > 0 && (
              <div className="chapter-answer-key break-inside-avoid page-break-inside-avoid my-6 p-4 bg-slate-50 rounded-xl border border-slate-300">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    ANSWER KEY – {chap.name} {chap.teluguName && <span className="font-telugu">({chap.teluguName})</span>}
                  </h3>
                  <span className="text-2xs font-mono font-semibold text-slate-500">
                    Total: {chapQuestions.length}
                  </span>
                </div>

                {/* 5-Column Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center text-xs font-mono">
                  {chapQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-1 rounded bg-white border border-slate-200 flex items-center justify-center gap-1"
                    >
                      <span className="text-slate-500 text-2xs">{q.questionNumber}.</span>
                      <span className="font-bold text-blue-700">{q.correctAnswer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. CHAPTER SOLUTIONS / EXPLANATIONS */}
            {(settings.includeSolutions !== false || isSolutionsOnly) && !isAnswersOnly && (
              <div className="chapter-solutions-block my-6 space-y-3">
                {chapQuestions.some(q => (q.solution && q.solution.trim()) || q.solutionImageUrl) ? (
                  <>
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        SOLUTIONS & EXPLANATIONS – {chap.name} {chap.teluguName && <span className="font-telugu">({chap.teluguName})</span>}
                      </h3>
                    </div>

                    <div className={columnsLayout === 'two' ? "solutions-two-columns" : "space-y-3"}>
                      {chapQuestions.filter(q => (q.solution && q.solution.trim()) || q.solutionImageUrl).map(q => (
                        <div
                          key={q.id}
                          className="solution-card break-inside-avoid page-break-inside-avoid p-3.5 rounded-lg border border-slate-200 bg-white space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-blue-700">
                              Question #{q.questionNumber}
                            </span>
                            {q.correctAnswer && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-2xs">
                                Correct Option: ({q.correctAnswer.toLowerCase()})
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                            {q.solution && <MathRenderer text={getCleanSolutionText(q.solution, q.solutionImageUrl)} />}
                            {q.solutionImageUrl && (
                              <div className="mt-2 text-center max-w-full overflow-hidden">
                                <img
                                  src={q.solutionImageUrl}
                                  alt="Solution Diagram"
                                  className="max-h-48 max-w-full w-auto h-auto object-contain rounded border border-slate-200 bg-white p-1 inline-block"
                                  style={{ maxWidth: '100%', objectFit: 'contain' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : isSolutionsOnly ? (
                  <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-50 rounded-lg border border-slate-200">
                    No solutions or explanations entered for {chap.name}.
                  </div>
                ) : null}
              </div>
            )}

          </div>
        );
      })}

    </div>
  );
};

export default BookRenderer;
