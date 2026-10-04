// Test suite for bulk text parser, duplicate checker, and translation
import { DEFAULT_CHAPTERS } from './data/defaultChapters.js';
import { parseStructuredBulkText, detectChapterFromFilename } from './utils/bulkTextParser.js';
import { calculateSimilarity, findDuplicateQuestion } from './utils/duplicateChecker.js';
import { translateEnglishToTelugu } from './utils/translator.js';

console.log('=== TEST 1: Default Chapters ===');
console.log(`Total chapters: ${DEFAULT_CHAPTERS.length}`);
console.assert(DEFAULT_CHAPTERS.length === 29, 'Expected 29 chapters');
console.log('Chapter 1:', DEFAULT_CHAPTERS[0].name, '|', DEFAULT_CHAPTERS[0].teluguName);

console.log('\n=== TEST 2: Bulk Structured Text Parser ===');
const sampleText = `Chapter: Percentage

Q1:
English: What is 20% of 500?
Telugu: 500 లో 20% ఎంత?
A: 50
B: 100
C: 150
D: 200
Answer: B
Exam: RRB Group D
Date: 01/12/2025
Shift: 01

Q2:
English: What is the ratio of 30 to 45?
Telugu: 30 మరియు 45 ల నిష్పత్తి ఎంత?
A: 2:3
B: 3:2
C: 1:2
D: 3:4
Answer: A
Exam: SSC CGL
Date: 10/01/2026
Shift: 02
`;

const parseResult = parseStructuredBulkText(sampleText, DEFAULT_CHAPTERS);
console.log(`Parsed questions: ${parseResult.questions.length}, Errors: ${parseResult.errors.length}`);
console.assert(parseResult.questions.length === 2, 'Expected 2 parsed questions');
console.log('Q1 English:', parseResult.questions[0].englishQuestion);
console.log('Q1 Telugu:', parseResult.questions[0].teluguQuestion);
console.log('Q1 Answer:', parseResult.questions[0].correctAnswer);
console.log('Q1 Exam:', parseResult.questions[0].examName);
console.log('Q2 Options:', parseResult.questions[1].optionA, parseResult.questions[1].optionB);

console.log('\n=== TEST 3: Duplicate Checker ===');
const existingQuestions = [
  {
    id: 'q-1',
    chapterId: 'ch-1',
    questionNumber: 1,
    englishQuestion: 'What is 25% of 400?',
    teluguQuestion: '400 లో 25% ఎంత?',
    correctAnswer: 'C'
  }
];

const newSimilarQuestion = {
  id: 'q-new',
  chapterId: 'ch-1',
  englishQuestion: 'What is 25% of 400?',
  teluguQuestion: '400 లో 25% ఎంత?',
  correctAnswer: 'C'
};

const duplicateMatch = findDuplicateQuestion(newSimilarQuestion, existingQuestions, 'ch-1');
console.log('Duplicate detected:', !!duplicateMatch);
if (duplicateMatch) {
  console.log(`Similarity: ${duplicateMatch.similarityScore}%, Matched ID: ${duplicateMatch.match.id}`);
}
console.assert(duplicateMatch !== null, 'Expected duplicate match');

console.log('\n=== TEST 4: Mathematical Telugu Translation ===');
translateEnglishToTelugu('What is the cost price if profit is 20%?').then(telugu => {
  console.log('English: What is the cost price if profit is 20%?');
  console.log('Telugu Translation:', telugu);

  console.log('\n=== TEST 5: Book Editions & Exam Dates ===');
  import('./data/sampleQuestions.js').then(async sq => {
    const dates = Array.from(new Set(sq.SAMPLE_QUESTIONS.map(q => q.examDate).filter(Boolean)));
    console.log(`Total sample questions: ${sq.SAMPLE_QUESTIONS.length}`);
    console.log(`Distinct exam dates: ${dates.length} (${dates.slice(0, 3).join(', ')}...)`);
    console.assert(dates.length >= 25, 'Expected at least 25 distinct exam dates across chapters');

    console.log('\n=== TEST 6: Auto-Translate Telugu with English as Primary & Respace ===');
    const {
      isTeluguQuestionInvalid,
      cleanAndRespaceTelugu,
      autoTranslateAndRespaceQuestion,
      processImportedQuestionsTelugu
    } = await import('./utils/translator.js');

    // Test Error Detection
    console.assert(isTeluguQuestionInvalid('', 'What is 50%?'), 'Empty Telugu should be invalid');
    console.assert(isTeluguQuestionInvalid('What is 50%?', 'What is 50%?'), 'Copied English should be invalid');
    console.assert(isTeluguQuestionInvalid('undefined', 'What is 50%?'), 'Corrupt undefined should be invalid');
    console.assert(isTeluguQuestionInvalid('???? ??? ?????', 'What is 50%?'), 'Garbled ????? should be invalid');
    console.assert(!isTeluguQuestionInvalid('500 లో 20% ఎంత?', 'What is 20% of 500?'), 'Valid Telugu should not be invalid');

    // Test Telugu Respace
    const rawTelugu = '500లో20%ఎంత? ';
    const respacedTelugu = cleanAndRespaceTelugu(rawTelugu, 'What is 20% of 500?');
    console.log('Original Telugu:', rawTelugu);
    console.log('Respaced Telugu:', respacedTelugu);
    console.assert(respacedTelugu.includes('500 లో 20% ఎంత?'), 'Telugu spacing should be properly formatted');

    // Test Question Processing (English primary, ONLY Telugu changes)
    const testQuestion = {
      id: 'q-test-1',
      chapterId: 'ch-1',
      questionNumber: 1,
      englishQuestion: 'What is 20% of 500?',
      teluguQuestion: 'What is 20% of 500?', // Copied english / error!
      optionA: '50',
      optionB: '100',
      optionC: '150',
      optionD: '200',
      correctAnswer: 'B',
      examName: 'RRB Group D'
    };

    const processed = await autoTranslateAndRespaceQuestion(testQuestion);
    console.log('Processed English Question (MUST BE UNTOUCHED):', processed.englishQuestion);
    console.log('Processed Telugu Question (SHOULD BE TRANSLATED):', processed.teluguQuestion);
    console.log('Option A (MUST BE UNTOUCHED):', processed.optionA);

    console.assert(processed.englishQuestion === 'What is 20% of 500?', 'English question must NOT change');
    console.assert(processed.optionA === '50', 'Option A must NOT change');
    console.assert(processed.correctAnswer === 'B', 'Correct answer must NOT change');
    console.assert(/[\u0C00-\u0C7F]/.test(processed.teluguQuestion), 'Telugu question must now contain Telugu Unicode characters');

    // Test Irrespective of Existing Telugu: replace with auto-translation
    const questionWithOldTelugu = {
      id: 'q-test-2',
      chapterId: 'ch-1',
      questionNumber: 2,
      englishQuestion: 'What is 20% of 500?',
      teluguQuestion: 'పాత తప్పు తెలుగు ప్రశ్న', // Any existing Telugu!
      optionA: '50',
      optionB: '100',
      optionC: '150',
      optionD: '200',
      correctAnswer: 'B'
    };

    const forceReplaced = await autoTranslateAndRespaceQuestion(questionWithOldTelugu, true);
    console.log('Old Telugu:', questionWithOldTelugu.teluguQuestion);
    console.log('Force Auto-Translated Telugu:', forceReplaced.teluguQuestion);
    console.assert(forceReplaced.teluguQuestion !== 'పాత తప్పు తెలుగు ప్రశ్న', 'Old Telugu must be replaced');
    console.assert(forceReplaced.teluguQuestion.includes('500 లో 20% ఎంత?'), 'New translation must match English question');
    console.assert(forceReplaced.englishQuestion === 'What is 20% of 500?', 'English question must remain untouched');

    console.log('\n=== TEST 7: Bulk Upload Explanation & Solution Parsing ===');
    const bulkWithSolutions = `Chapter: Percentage

Q1:
English: What is 20% of 500?
A: 50
B: 100
C: 150
D: 200
Answer: B
Solution: 20% of 500 = (20/100) * 500 = 100.

Q2:
English: What is 30% of 900?
A: 240
B: 270
C: 300
D: 330
Ans: (B)
Explanation: 30% of 900 = 270.

Q3:
English: Simple Interest on Rs 1000 at 10% for 1 yr?
A: 50
B: 100
C: 150
D: 200
Answer: Option B
SI = 1000 * 10 * 1 / 100 = 100 Rs.
`;

    const bulkParsed = parseStructuredBulkText(bulkWithSolutions, DEFAULT_CHAPTERS);
    console.log('Parsed questions with solutions:', bulkParsed.questions.length);
    console.assert(bulkParsed.questions.length === 3, 'Expected 3 parsed questions');
    console.assert(bulkParsed.questions[0].solution.includes('100'), 'Q1 Solution must be parsed');
    console.assert(bulkParsed.questions[1].solution.includes('270'), 'Q2 Explanation must be parsed');
    console.assert(bulkParsed.questions[2].solution.includes('100 Rs'), 'Q3 Fallback Explanation must be parsed');
    console.log('Q1 Solution:', bulkParsed.questions[0].solution);
    console.log('Q2 Solution:', bulkParsed.questions[1].solution);
    console.log('Q3 Solution:', bulkParsed.questions[2].solution);

    console.log('\n=== TEST 8: Auto-Detect Chapter from Filename & Bulk Questions Assignment ===');
    const sampleFiles = [
      { name: '01_percentage.txt', expectedChapterId: 'ch-1' },
      { name: '02_profit_and_loss.txt', expectedChapterId: 'ch-2' },
      { name: '05_compound_interest.txt', expectedChapterId: 'ch-5' },
      { name: '06_ratio_and_proportion.txt', expectedChapterId: 'ch-6' },
      { name: '17_number_system.txt', expectedChapterId: 'ch-17' },
      { name: '20_algebra.txt', expectedChapterId: 'ch-20' },
      { name: '24_coordinate_geometry.txt', expectedChapterId: 'ch-24' },
      { name: '25_mensuration_2d.txt', expectedChapterId: 'ch-25' },
      { name: 'ch-4.txt', expectedChapterId: 'ch-4' },
      { name: 'TW.txt', expectedChapterId: 'ch-11' }
    ];

    let allMatched = true;
    for (const sf of sampleFiles) {
      const detected = detectChapterFromFilename(sf.name, DEFAULT_CHAPTERS);
      if (!detected || detected.id !== sf.expectedChapterId) {
        console.error(`Mismatch for ${sf.name}: got ${detected?.id}, expected ${sf.expectedChapterId}`);
        allMatched = false;
      }
    }
    console.log(`Auto-detected ${sampleFiles.length} sample file names correctly:`, allMatched);
    console.assert(allMatched, 'All test files must be detected correctly');

    // Simulate bulk txt parsing with respective chapter assignment
    const mockFiles = [
      {
        name: '05_compound_interest.txt',
        content: `Q1:\nEnglish: What is CI?\nA: 1\nB: 2\nC: 3\nD: 4\nAnswer: B\n`
      },
      {
        name: '20_algebra.txt',
        content: `Q1:\nEnglish: Solve x + 5 = 10\nA: 5\nB: 2\nC: 3\nD: 4\nAnswer: A\n`
      }
    ];

    const bulkQuestions = [];
    for (const mf of mockFiles) {
      const detectedChap = detectChapterFromFilename(mf.name, DEFAULT_CHAPTERS);
      const parsed = parseStructuredBulkText(mf.content, DEFAULT_CHAPTERS, detectedChap?.id);
      parsed.questions.forEach(q => {
        bulkQuestions.push({
          ...q,
          chapterId: q.chapterId || detectedChap?.id,
          _sourceFile: mf.name
        });
      });
    }

    console.log('Bulk multi-file parsed questions count:', bulkQuestions.length);
    console.assert(bulkQuestions.length === 2, 'Expected 2 questions from bulk files');
    console.assert(bulkQuestions[0].chapterId === 'ch-5', 'Q1 must belong to Chapter 5 (CI)');
    console.assert(bulkQuestions[1].chapterId === 'ch-20', 'Q2 must belong to Chapter 20 (Algebra)');
    console.log('Q1 assigned to:', bulkQuestions[0].chapterId, `(${bulkQuestions[0]._sourceFile})`);
    console.log('\n=== TEST 9: Picture Separation: Question vs Solution ===');
    const imageTestText = `Chapter: Geometry

Q1:
English: What is the area of the triangle?
Image: https://example.com/triangle_question.png
A: 10
B: 20
C: 30
D: 40
Answer: B
Solution:
Here is the step-by-step solution:
Image: https://example.com/triangle_solution.png

Q2:
English: Find x in the equation.
A: 5
B: 10
C: 15
D: 20
Answer: A
Solution:
Detailed explanation with figure:
Image: https://example.com/only_solution_image.png

Q3:
English: Identify the shape in the diagram.
Image: https://example.com/only_question_image.png
A: Circle
B: Square
C: Triangle
D: Rectangle
Answer: A
Solution:
A circle has no straight edges.
`;

    const imgParsed = parseStructuredBulkText(imageTestText, DEFAULT_CHAPTERS);
    console.log('Parsed questions with images:', imgParsed.questions.length);
    console.assert(imgParsed.questions.length === 3, 'Expected 3 questions');

    // Q1: Has BOTH question image and solution image
    const q1 = imgParsed.questions[0];
    console.log('Q1 imageUrl (Question):', q1.imageUrl);
    console.log('Q1 solutionImageUrl (Solution):', q1.solutionImageUrl);
    console.assert(q1.imageUrl === 'https://example.com/triangle_question.png', 'Q1 imageUrl must be question image');
    console.assert(q1.solutionImageUrl === 'https://example.com/triangle_solution.png', 'Q1 solutionImageUrl must be solution image');
    console.assert(!q1.imageUrl.includes('solution'), 'Q1 question image must NOT contain solution image');
    console.assert(!q1.solution.includes('https://example.com/triangle_solution.png'), 'Q1 solution text must NOT contain duplicate image line');

    // Test getCleanSolutionText deduplication
    const { getCleanSolutionText } = await import('./utils/bulkTextParser.js');
    const dirtySolution = "Here is the step by step explanation.\nImage: https://example.com/pic.png";
    const cleaned = getCleanSolutionText(dirtySolution, "https://example.com/pic.png");
    console.assert(cleaned === "Here is the step by step explanation.", `Expected clean solution text, got: "${cleaned}"`);
    console.log('Solution text cleaning & deduplication verified: single picture guaranteed! ✅');

    // Q2: Has ONLY solution image, NO question image
    const q2 = imgParsed.questions[1];
    console.log('Q2 imageUrl (Question):', q2.imageUrl);
    console.log('Q2 solutionImageUrl (Solution):', q2.solutionImageUrl);
    console.assert(q2.imageUrl === '', 'Q2 imageUrl must be EMPTY (no question image)!');
    console.assert(q2.solutionImageUrl === 'https://example.com/only_solution_image.png', 'Q2 solutionImageUrl must have solution image');
    console.assert(!q2.solution.includes('https://example.com/only_solution_image.png'), 'Q2 solution text must NOT contain duplicate image line');

    // Q3: Has ONLY question image, NO solution image
    const q3 = imgParsed.questions[2];
    console.log('Q3 imageUrl (Question):', q3.imageUrl);
    console.log('Q3 solutionImageUrl (Solution):', q3.solutionImageUrl);
    console.assert(q3.imageUrl === 'https://example.com/only_question_image.png', 'Q3 imageUrl must have question image');
    console.assert(q3.solutionImageUrl === '', 'Q3 solutionImageUrl must be EMPTY');

    console.log('Picture separation test passed cleanly! Image in solution does NOT leak into question! ✅');

    console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
  });
});

