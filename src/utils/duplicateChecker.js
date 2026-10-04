/**
 * Calculates string similarity using word-level Jaccard index and character overlap
 */
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const clean1 = str1.toLowerCase().replace(/[^\w\s\u0C00-\u0C7F]/g, ' ').trim();
  const clean2 = str2.toLowerCase().replace(/[^\w\s\u0C00-\u0C7F]/g, ' ').trim();

  if (clean1 === clean2) return 1.0;

  const words1 = new Set(clean1.split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(clean2.split(/\s+/).filter(w => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach(word => {
    if (words2.has(word)) intersection++;
  });

  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
};

/**
 * Check if a question is duplicate of existing questions in the same chapter
 */
export const findDuplicateQuestion = (newQuestion, existingQuestions, targetChapterId) => {
  if (!newQuestion || !newQuestion.englishQuestion) return null;

  // Filter existing questions by chapter, excluding self if editing
  const chapterQuestions = existingQuestions.filter(
    q => q.chapterId === targetChapterId && q.id !== newQuestion.id
  );

  let bestMatch = null;
  let highestScore = 0;

  for (const existing of chapterQuestions) {
    const enScore = calculateSimilarity(newQuestion.englishQuestion, existing.englishQuestion);
    const teScore = (newQuestion.teluguQuestion && existing.teluguQuestion)
      ? calculateSimilarity(newQuestion.teluguQuestion, existing.teluguQuestion)
      : 0;

    const maxScore = Math.max(enScore, teScore);

    if (maxScore > highestScore) {
      highestScore = maxScore;
      bestMatch = existing;
    }
  }

  // Threshold of 60% similarity
  if (highestScore >= 0.60 && bestMatch) {
    return {
      match: bestMatch,
      similarityScore: Math.round(highestScore * 100)
    };
  }

  return null;
};
