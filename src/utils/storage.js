import { DEFAULT_CHAPTERS } from '../data/defaultChapters.js';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions.js';

const CHAPTERS_KEY = 'exam_maker_chapters_v2';
const QUESTIONS_KEY = 'exam_maker_questions_v4'; // Blank database by default
const DRAFT_KEY = 'exam_maker_draft_v1';
const SETTINGS_KEY = 'exam_maker_settings_v1';
const BOOKS_KEY = 'exam_maker_books_v1';
const ACTIVE_BOOK_KEY = 'exam_maker_active_book_v1';

export const DEFAULT_BOOKS = [
  {
    id: 'book-1',
    title: 'RAILWAY & SSC MATHEMATICS',
    subtitle: 'Chapter-Wise Bilingual MCQ Practice Book (English & Telugu Medium)',
    publicationDate: '2026-03-09',
    authorName: 'EXAM EXPERTS PANEL',
    instituteName: 'VICTORY COMPETITIVE ACADEMY',
    examCategory: 'RRB NTPC | Group D | Technician | ALP | SSC CGL | CHSL',
    editionYear: '2026 EDITION',
    coverTheme: 'navy-gold',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'book-2',
    title: 'SSC CGL & CHSL ADVANCED MATHS',
    subtitle: 'Algebra, Geometry, Trigonometry, Coordinate & Mensuration Master Book',
    publicationDate: '2026-04-15',
    authorName: 'SSC MATHS FACULTY',
    instituteName: 'VICTORY EXAM EDITIONS',
    examCategory: 'SSC CGL Tier-1 & 2 | CHSL | CPO | MTS',
    editionYear: '2026 EDITION',
    coverTheme: 'crimson',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'book-3',
    title: 'BANKING & INSURANCE QUANTITATIVE APTITUDE',
    subtitle: 'Speed Maths, Arithmetic & Data Interpretation Practice Series',
    publicationDate: '2026-05-01',
    authorName: 'BANKING CAREER EXPERTS',
    instituteName: 'VICTORY BANKING ACADEMY',
    examCategory: 'IBPS PO | Clerk | SBI PO | RRB Scale-I',
    editionYear: '2026 EDITION',
    coverTheme: 'royal-blue',
    createdAt: '2026-02-01T00:00:00.000Z'
  }
];

export const DEFAULT_BOOK_SETTINGS = {
  bookTitle: 'RAILWAY & SSC MATHEMATICS',
  bookSubtitle: 'Chapter-Wise Bilingual MCQ Practice Book (English & Telugu Medium)',
  authorName: 'EXAM EXPERTS PANEL',
  instituteName: 'VICTORY COMPETITIVE ACADEMY',
  examCategory: 'RRB NTPC | Group D | Technician | ALP | SSC CGL | CHSL',
  editionYear: '2026 EDITION',
  publicationDate: '2026-03-09',
  coverTheme: 'navy-gold',
  fontSize: 'standard',
  optionLayout: 'auto',
  includeCover: true,
  includeIndex: true,
  includeAnswerKey: true,
  includeSolutions: true,
  headerText: 'RAILWAY & SSC BILINGUAL MATHS QUESTION BANK',
  footerText: 'Victory Exam Series - Confidential & For Practice Only',
  pageNumberStyle: 'Page X of Y',
  startingQuestionNumber: 1,
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
  twoColumnImageLayout: 'after_questions'
};

export const getStoredBooks = () => {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
      return DEFAULT_BOOKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_BOOKS;
  }
};

export const saveStoredBooks = (books) => {
  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  } catch (e) {
    console.error('Failed to save books:', e);
  }
};

export const getActiveBookId = () => {
  try {
    return localStorage.getItem(ACTIVE_BOOK_KEY) || 'book-1';
  } catch (e) {
    return 'book-1';
  }
};

export const saveActiveBookId = (bookId) => {
  try {
    localStorage.setItem(ACTIVE_BOOK_KEY, bookId);
  } catch (e) {
    console.error('Failed to save active book id:', e);
  }
};

export const getStoredChapters = () => {
  try {
    const raw = localStorage.getItem(CHAPTERS_KEY);
    if (!raw) {
      localStorage.setItem(CHAPTERS_KEY, JSON.stringify(DEFAULT_CHAPTERS));
      return DEFAULT_CHAPTERS;
    }
    const parsed = JSON.parse(raw);
    const migrated = parsed.map(c => {
      // Clean legacy seeded default subsections (e.g., sub-1-1, sub-21-2)
      const cleanSubs = (c.subsections || []).filter(s => !/^sub-\d+-\d+$/.test(s.id));
      return {
        ...c,
        subsections: cleanSubs
      };
    });
    return migrated;
  } catch (e) {
    console.error('Failed to load chapters from storage:', e);
    return DEFAULT_CHAPTERS;
  }
};

export const saveStoredChapters = (chapters) => {
  try {
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(chapters));
  } catch (e) {
    console.error('Failed to save chapters:', e);
  }
};

export const getStoredQuestions = () => {
  try {
    // Purge legacy seeded keys to prevent stale bloated data from consuming storage and cache
    localStorage.removeItem('exam_maker_questions_v3');
    localStorage.removeItem('exam_maker_questions_v2');
    localStorage.removeItem('exam_maker_questions_v1');

    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (!raw) {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load questions from storage:', e);
    return [];
  }
};

export const resetToSampleQuestions = () => {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify([]));
    return [];
  } catch (e) {
    console.error('Failed to reset questions in storage:', e);
    return [];
  }
};

export const saveStoredQuestions = (questions) => {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error('Failed to save questions:', e);
  }
};

export const getStoredDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveStoredDraft = (draft) => {
  try {
    if (!draft) {
      localStorage.removeItem(DRAFT_KEY);
    } else {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
    }
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
};

export const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_BOOK_SETTINGS;
    return { ...DEFAULT_BOOK_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_BOOK_SETTINGS;
  }
};

export const saveStoredSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const clearAllLocalStorage = () => {
  try {
    localStorage.removeItem(CHAPTERS_KEY);
    localStorage.removeItem(QUESTIONS_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(BOOKS_KEY);
    localStorage.removeItem(ACTIVE_BOOK_KEY);
    localStorage.removeItem('exam_maker_questions_v3');
    localStorage.removeItem('exam_maker_questions_v2');
    localStorage.removeItem('exam_maker_questions_v1');
    localStorage.clear();
    // Re-seed clean defaults
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(DEFAULT_CHAPTERS));
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify([]));
    localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
    localStorage.setItem(ACTIVE_BOOK_KEY, 'book-1');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_BOOK_SETTINGS));
    return true;
  } catch (e) {
    console.error('Failed to clear storage:', e);
    return false;
  }
};

