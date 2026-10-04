import React, { useState, useEffect } from 'react';
import MathRenderer from '../utils/mathParser';

/**
 * AdaptiveQuestionBody
 * 
 * Renders bilingual question text (English & Telugu) with adaptive diagram/picture layout:
 * - If the picture has a wide aspect ratio (width > height * 1.25) or doesn't fit on the side,
 *   it automatically adapts to fit inside the given text div without exceeding or breaking the overlay.
 * - If the picture is compact/square (ratio <= 1.25), it sits neatly on the side with strict max-width
 *   and overflow constraints.
 * - In two-column mode, it fits responsively inside the column text block.
 */
const AdaptiveQuestionBody = ({
  englishQuestion = '',
  teluguQuestion = '',
  imageUrl = '',
  questionNumber = null,
  hasMath = false,
  isTwoColumn = false,
  twoColImgPos = 'after_questions',
  questionNumberColor = 'text-blue-700 dark:text-blue-400',
  emptyEnglishPlaceholder = 'Enter English question text...',
  emptyTeluguPlaceholder = 'తెలుగు ప్రశ్న ఇక్కడ కనిపిస్తుంది...'
}) => {
  const [isWide, setIsWide] = useState(false);

  // Evaluate image dimensions and aspect ratio
  const evaluateAspectRatio = (img) => {
    if (!img) return;
    const { naturalWidth, naturalHeight } = img;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      // If width is significantly greater than height (ratio > 1.25),
      // the image is landscape and will be cramped on the side.
      // Move it into the given text div to fit properly.
      const wide = ratio > 1.25;
      if (wide !== isWide) {
        setIsWide(wide);
      }
    }
  };

  useEffect(() => {
    if (!imageUrl) {
      setIsWide(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setIsWide(img.naturalWidth / img.naturalHeight > 1.25);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const renderEnglishText = () => (
    <div className={`text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-start gap-1.5 ${hasMath ? 'leading-loose pb-1' : 'leading-relaxed'}`}>
      {questionNumber && (
        <span className={`font-bold min-w-[20px] shrink-0 ${questionNumberColor}`}>
          {questionNumber}.
        </span>
      )}
      <div className="flex-1 min-w-0 break-words">
        {englishQuestion ? (
          <MathRenderer text={englishQuestion} />
        ) : (
          <span className="text-slate-400 italic font-normal">{emptyEnglishPlaceholder}</span>
        )}
      </div>
    </div>
  );

  const renderTeluguText = () => {
    if (!teluguQuestion && !emptyTeluguPlaceholder) return null;
    return (
      <div className={`text-xs sm:text-sm font-telugu ${hasMath ? 'leading-loose pb-1' : 'leading-relaxed'} ${questionNumber ? 'pl-5 sm:pl-6' : ''} break-words`}>
        {teluguQuestion ? (
          <MathRenderer text={teluguQuestion} />
        ) : (
          <span className="text-slate-400 italic font-sans font-normal">{emptyTeluguPlaceholder}</span>
        )}
      </div>
    );
  };

  const renderInTextImage = (maxHeightClass = 'max-h-44 sm:max-h-48') => (
    <div className={`my-2 w-full max-w-full overflow-hidden flex items-center justify-center ${questionNumber ? 'pl-5 sm:pl-6' : ''}`}>
      <img
        src={imageUrl}
        alt="Question Diagram"
        ref={evaluateAspectRatio}
        onLoad={(e) => evaluateAspectRatio(e.currentTarget)}
        className={`${maxHeightClass} max-w-full w-auto h-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1 shadow-2xs block`}
        style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
        onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
      />
    </div>
  );

  // 1. Two-Column Layout (Printed or Previewed Multi-column)
  if (imageUrl && isTwoColumn) {
    return (
      <div className="space-y-1.5 min-w-0 w-full overflow-hidden">
        {renderEnglishText()}

        {twoColImgPos === 'between_languages' && renderInTextImage('max-h-36')}

        {renderTeluguText()}

        {twoColImgPos === 'after_questions' && renderInTextImage('max-h-36')}
      </div>
    );
  }

  // 2. Wide Aspect Ratio: Picture is fitted directly into the given text div
  // so it does NOT get squished on the side or go out of the overlay/card bounds.
  if (imageUrl && isWide) {
    return (
      <div className="space-y-1.5 min-w-0 w-full overflow-hidden">
        {renderEnglishText()}
        {renderTeluguText()}
        {renderInTextImage('max-h-44 sm:max-h-48')}
      </div>
    );
  }

  // 3. Compact/Square Aspect Ratio: Picture sits neatly on the side with strict containment
  if (imageUrl && !isWide) {
    return (
      <div className="flex items-start justify-between gap-3 sm:gap-4 w-full min-w-0 overflow-hidden">
        <div className="flex-1 min-w-0 space-y-1.5">
          {renderEnglishText()}
          {renderTeluguText()}
        </div>

        {/* Side Picture Element - strictly constrained so it never bursts out */}
        <div className="side-picture-box shrink-0 w-28 sm:w-36 max-w-[34%] min-w-0 overflow-hidden flex items-center justify-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
          <img
            src={imageUrl}
            alt="Question Diagram"
            ref={evaluateAspectRatio}
            onLoad={(e) => evaluateAspectRatio(e.currentTarget)}
            className="max-h-28 max-w-full w-auto h-auto object-contain block"
            style={{ maxWidth: '100%', maxHeight: '112px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>
      </div>
    );
  }

  // 4. Standard Question without Image
  return (
    <div className="space-y-1.5 min-w-0 w-full">
      {renderEnglishText()}
      {renderTeluguText()}
    </div>
  );
};

export default AdaptiveQuestionBody;
