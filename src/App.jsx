import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import DashboardTab from './components/DashboardTab';
import QuestionBuilderTab from './components/QuestionBuilderTab';
import QuestionBankTab from './components/QuestionBankTab';
import BulkImportTab from './components/BulkImportTab';
import PdfStudioTab from './components/PdfStudioTab';
import SettingsModal from './components/SettingsModal';
import DuplicateModal from './components/DuplicateModal';
import ResetStorageModal from './components/ResetStorageModal';

import {
  getStoredChapters,
  saveStoredChapters,
  getStoredQuestions,
  saveStoredQuestions,
  getStoredDraft,
  saveStoredDraft,
  getStoredSettings,
  saveStoredSettings,
  getStoredBooks,
  saveStoredBooks,
  getActiveBookId,
  saveActiveBookId,
  resetToSampleQuestions,
  clearAllLocalStorage,
  DEFAULT_BOOKS,
  DEFAULT_BOOK_SETTINGS
} from './utils/storage';
import { DEFAULT_CHAPTERS } from './data/defaultChapters';
import { findDuplicateQuestion } from './utils/duplicateChecker';

function App() {
  // Global Data State
  const [chapters, setChapters] = useState(getStoredChapters);
  const [questions, setQuestions] = useState(getStoredQuestions);
  const [draft, setDraft] = useState(getStoredDraft);
  const [settings, setSettings] = useState(getStoredSettings);
  const [books, setBooks] = useState(getStoredBooks);
  const [activeBookId, setActiveBookId] = useState(getActiveBookId);

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [builderSelectedChapter, setBuilderSelectedChapter] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Duplicate Check Modal State
  const [duplicateCheck, setDuplicateCheck] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState(null);

  // Notification Banner
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync dark mode class with root html
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist state changes
  useEffect(() => {
    saveStoredChapters(chapters);
  }, [chapters]);

  useEffect(() => {
    saveStoredQuestions(questions);
  }, [questions]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredBooks(books);
  }, [books]);

  useEffect(() => {
    saveActiveBookId(activeBookId);
  }, [activeBookId]);

  // Book Selection and Creation Handlers
  const handleSelectBook = (bookId) => {
    setActiveBookId(bookId);
    const targetBook = books.find(b => b.id === bookId);
    if (targetBook) {
      setSettings(prev => ({
        ...prev,
        bookTitle: targetBook.title,
        bookSubtitle: targetBook.subtitle || prev.bookSubtitle,
        publicationDate: targetBook.publicationDate || prev.publicationDate,
        authorName: targetBook.authorName || prev.authorName,
        instituteName: targetBook.instituteName || prev.instituteName,
        examCategory: targetBook.examCategory || prev.examCategory,
        editionYear: targetBook.editionYear || prev.editionYear
      }));
      showNotification(`Switched to Book: "${targetBook.title}" (Date: ${targetBook.publicationDate})`);
    }
  };

  const handleAddBook = (bookData) => {
    const pubDate = bookData.publicationDate || new Date().toISOString().split('T')[0];
    const year = pubDate.split('-')[0] || '2026';
    const newBook = {
      id: `book-${Date.now()}`,
      title: bookData.title,
      subtitle: bookData.subtitle || 'Chapter-Wise Bilingual MCQ Practice Book',
      publicationDate: pubDate,
      authorName: bookData.authorName || settings.authorName,
      instituteName: bookData.instituteName || settings.instituteName,
      examCategory: bookData.examCategory || settings.examCategory,
      editionYear: `${year} EDITION`,
      coverTheme: 'navy-gold',
      createdAt: new Date().toISOString()
    };
    setBooks(prev => [...prev, newBook]);
    handleSelectBook(newBook.id);
    showNotification(`New Book Edition Created: "${newBook.title}"!`);
  };

  // Handle Draft Updates
  const handleUpdateDraft = (newDraft) => {
    setDraft(newDraft);
    saveStoredDraft(newDraft);
  };

  const handleClearDraft = () => {
    setDraft(null);
    saveStoredDraft(null);
  };

  // Question Save Logic with Duplicate Detection
  const handleSaveQuestion = (questionData) => {
    const questionWithBook = {
      ...questionData,
      bookId: questionData.bookId || activeBookId || 'book-1'
    };

    // If not editing, check for duplicates in the chapter
    if (!editingQuestion) {
      const dupResult = findDuplicateQuestion(questionWithBook, questions, questionWithBook.chapterId);
      if (dupResult) {
        setDuplicateCheck(dupResult);
        setPendingQuestion(questionWithBook);
        return;
      }
    }

    commitQuestionSave(questionWithBook);
  };

  const commitQuestionSave = (questionData) => {
    const finalizedQ = {
      ...questionData,
      bookId: questionData.bookId || activeBookId || 'book-1'
    };

    if (editingQuestion) {
      setQuestions(prev => prev.map(q => q.id === finalizedQ.id ? finalizedQ : q));
      setEditingQuestion(null);
      showNotification('Question updated successfully!');
    } else {
      setQuestions(prev => [...prev, finalizedQ]);
      handleClearDraft();
      showNotification('Question added to Chapter and Book PDF!');
      // Trigger subtle celebration confetti
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 }
        });
      } catch (e) { }
    }
  };

  // Duplicate Modal Handlers
  const handleKeepBoth = () => {
    if (pendingQuestion) {
      commitQuestionSave(pendingQuestion);
      setPendingQuestion(null);
      setDuplicateCheck(null);
    }
  };

  const handleReplaceExisting = () => {
    if (pendingQuestion && duplicateCheck) {
      const existingId = duplicateCheck.match.id;
      const updated = { ...pendingQuestion, id: existingId };
      setQuestions(prev => prev.map(q => q.id === existingId ? updated : q));
      setPendingQuestion(null);
      setDuplicateCheck(null);
      handleClearDraft();
      showNotification('Existing question replaced with new version!');
    }
  };

  const handleCancelDuplicate = () => {
    setPendingQuestion(null);
    setDuplicateCheck(null);
  };

  // Question Actions
  const handleEditQuestion = (q) => {
    setEditingQuestion(q);
    setActiveTab('builder');
  };

  const handleDeleteQuestion = (qId) => {
    setQuestions(prev => prev.filter(q => q.id !== qId));
    showNotification('Question removed.');
  };

  const handleDuplicateQuestion = (q) => {
    const chapterQuestions = questions.filter(item => item.chapterId === q.chapterId);
    const newQ = {
      ...q,
      id: `q-${Date.now()}`,
      questionNumber: chapterQuestions.length + 1,
      englishQuestion: `${q.englishQuestion} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setQuestions(prev => [...prev, newQ]);
    showNotification('Question duplicated!');
  };

  const handleMoveQuestion = (qId, targetChapterId) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, chapterId: targetChapterId } : q));
    showNotification('Question moved to another chapter.');
  };

  const handleReorderQuestion = (qId, direction) => {
    const currentQ = questions.find(q => q.id === qId);
    if (!currentQ) return;

    // Reorder only within the same chapter
    const chapterQuestions = questions.filter(q => q.chapterId === currentQ.chapterId);
    const currentIndex = chapterQuestions.findIndex(q => q.id === qId);

    if (direction === 'up' && currentIndex > 0) {
      const targetQ = chapterQuestions[currentIndex - 1];
      const tempNo = currentQ.questionNumber;
      currentQ.questionNumber = targetQ.questionNumber;
      targetQ.questionNumber = tempNo;
      setQuestions([...questions]);
    } else if (direction === 'down' && currentIndex < chapterQuestions.length - 1) {
      const targetQ = chapterQuestions[currentIndex + 1];
      const tempNo = currentQ.questionNumber;
      currentQ.questionNumber = targetQ.questionNumber;
      targetQ.questionNumber = tempNo;
      setQuestions([...questions]);
    }
  };

  const handleRenumberChapter = (chapterId) => {
    let num = 1;
    setQuestions(prev => prev.map(q => {
      if (q.chapterId === chapterId) {
        return { ...q, questionNumber: num++ };
      }
      return q;
    }));
    showNotification('Chapter questions renumbered sequentially (1, 2, 3...)');
  };

  // Bulk Operations
  const handleBulkDelete = (qIds) => {
    const idsSet = new Set(qIds);
    setQuestions(prev => prev.filter(q => !idsSet.has(q.id)));
    showNotification(`${qIds.length} questions deleted.`);
  };

  const handleBulkMove = (qIds, targetChapterId) => {
    const idsSet = new Set(qIds);
    setQuestions(prev => prev.map(q => idsSet.has(q.id) ? { ...q, chapterId: targetChapterId } : q));
    showNotification(`${qIds.length} questions moved to new chapter.`);
  };

  const handleImportQuestions = (newQuestions) => {
    setQuestions(prev => [...prev, ...newQuestions]);
    showNotification(`${newQuestions.length} questions imported into Question Bank & PDF!`);
  };

  // Chapter Operations
  const handleAddChapter = (chapterData) => {
    const newChap = {
      id: `ch-${Date.now()}`,
      order: chapters.length + 1,
      name: chapterData.name,
      teluguName: chapterData.teluguName,
      code: chapterData.name.substring(0, 4).toUpperCase(),
      icon: 'Layers'
    };
    setChapters(prev => [...prev, newChap]);
    showNotification(`Chapter "${chapterData.name}" created!`);
  };

  const handleEditChapter = (chapId, updatedData) => {
    setChapters(prev => prev.map(c => c.id === chapId ? { ...c, ...updatedData } : c));
    showNotification('Chapter renamed successfully.');
  };

  const handleDeleteChapter = (chapId) => {
    if (confirm('Are you sure you want to delete this chapter? Questions in it will be moved to the first chapter.')) {
      const fallbackChapterId = chapters.find(c => c.id !== chapId)?.id || 'ch-1';
      setQuestions(prev => prev.map(q => q.chapterId === chapId ? { ...q, chapterId: fallbackChapterId } : q));
      setChapters(prev => prev.filter(c => c.id !== chapId));
      showNotification('Chapter deleted.');
    }
  };

  const handleReorderChapters = (chapId, direction) => {
    const index = chapters.findIndex(c => c.id === chapId);
    let newChapters = [...chapters];
    if (direction === 'up' && index > 0) {
      const temp = newChapters[index];
      newChapters[index] = newChapters[index - 1];
      newChapters[index - 1] = temp;
      setChapters(newChapters);
    } else if (direction === 'down' && index < chapters.length - 1) {
      const temp = newChapters[index];
      newChapters[index] = newChapters[index + 1];
      newChapters[index + 1] = temp;
      setChapters(newChapters);
    }
  };

  // Subsection Operations (Add Subsection as Sub-Chapter)
  const handleAddSubsection = (chapterId, subsectionData) => {
    const subId = `sub-${Date.now()}`;
    const newSub = {
      id: subId,
      code: subsectionData.code || '',
      name: subsectionData.name,
      teluguName: subsectionData.teluguName || subsectionData.name
    };

    setChapters(prev => prev.map(c => {
      if (c.id === chapterId) {
        const subs = c.subsections || [];
        const orderCode = subsectionData.code || `${c.order}.${subs.length + 1}`;
        return {
          ...c,
          subsections: [...subs, { ...newSub, code: orderCode }]
        };
      }
      return c;
    }));

    showNotification(`Subsection "${subsectionData.name}" added to Chapter!`);
    return subId;
  };

  const handleDeleteSubsection = (chapterId, subsectionId) => {
    setChapters(prev => prev.map(c => {
      if (c.id === chapterId) {
        return {
          ...c,
          subsections: (c.subsections || []).filter(s => s.id !== subsectionId)
        };
      }
      return c;
    }));
    setQuestions(prev => prev.map(q => q.subsectionId === subsectionId ? { ...q, subsectionId: null, topic: '' } : q));
    showNotification('Subsection deleted.');
  };

  // Quick navigation helpers
  const handleNavigateToBuilder = (chapterId = null) => {
    setEditingQuestion(null);
    if (chapterId) {
      setBuilderSelectedChapter(chapterId);
    }
    setActiveTab('builder');
  };

  const handleSelectChapterFromDashboard = (chapterId) => {
    setActiveTab('bank');
  };

  // Handle Delete Local Storage / Complete Data Reset
  const handleConfirmResetStorage = () => {
    clearAllLocalStorage();
    setQuestions([]);
    setChapters(DEFAULT_CHAPTERS);
    setDraft(null);
    setSettings(DEFAULT_BOOK_SETTINGS);
    setBooks(DEFAULT_BOOKS);
    setActiveBookId('book-1');
    setEditingQuestion(null);
    setBuilderSelectedChapter(null);
    setIsResetModalOpen(false);
    showNotification('All local storage data and questions have been deleted! Fresh testing started.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-xl border border-slate-700/40 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {notification.msg}
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalQuestions={questions.length}
        totalChapters={chapters.length}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickGeneratePDF={() => setActiveTab('pdf')}
        books={books}
        activeBookId={activeBookId}
        onSelectBook={handleSelectBook}
        onDeleteLocalStorage={() => setIsResetModalOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {activeTab === 'dashboard' && (
          <DashboardTab
            chapters={chapters}
            questions={questions}
            draft={draft}
            onSelectChapter={handleSelectChapterFromDashboard}
            onNavigateToBuilder={handleNavigateToBuilder}
            onNavigateToBank={() => setActiveTab('bank')}
            onNavigateToPDF={() => setActiveTab('pdf')}
            onAddChapter={handleAddChapter}
            onEditChapter={handleEditChapter}
            onDeleteChapter={handleDeleteChapter}
            onReorderChapters={handleReorderChapters}
            books={books}
            activeBookId={activeBookId}
            onSelectBook={handleSelectBook}
            onAddBook={handleAddBook}
            onAddSubsection={handleAddSubsection}
            onDeleteSubsection={handleDeleteSubsection}
          />
        )}

        {activeTab === 'builder' && (
          <QuestionBuilderTab
            chapters={chapters}
            questions={questions}
            draft={draft}
            onSaveQuestion={handleSaveQuestion}
            onUpdateDraft={handleUpdateDraft}
            onClearDraft={handleClearDraft}
            selectedChapterId={builderSelectedChapter}
            editingQuestion={editingQuestion}
            onCancelEdit={() => setEditingQuestion(null)}
            onNavigateToPDF={() => setActiveTab('pdf')}
            books={books}
            activeBookId={activeBookId}
            onAddSubsection={handleAddSubsection}
          />
        )}

        {activeTab === 'bank' && (
          <QuestionBankTab
            chapters={chapters}
            questions={questions}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onDuplicateQuestion={handleDuplicateQuestion}
            onMoveQuestion={handleMoveQuestion}
            onReorderQuestion={handleReorderQuestion}
            onRenumberChapter={handleRenumberChapter}
            onBulkDelete={handleBulkDelete}
            onBulkMove={handleBulkMove}
            onNavigateToBuilder={handleNavigateToBuilder}
            onClearAllQuestions={() => {
              if (confirm('Are you sure you want to clear all questions? This cannot be undone.')) {
                setQuestions([]);
                showNotification('All questions have been cleared from database.');
              }
            }}
            books={books}
            activeBookId={activeBookId}
            onSelectBook={handleSelectBook}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkImportTab
            chapters={chapters}
            onImportQuestions={handleImportQuestions}
            onNavigateToBank={() => setActiveTab('bank')}
          />
        )}

        {activeTab === 'pdf' && (
          <PdfStudioTab
            settings={settings}
            chapters={chapters}
            questions={questions}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUpdateSettings={(updated) => setSettings(prev => ({ ...prev, ...updated }))}
            books={books}
            activeBookId={activeBookId}
            onSelectBook={handleSelectBook}
          />
        )}

      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showNotification('Book settings saved!');
        }}
      />

      {/* Duplicate Detection Modal */}
      <DuplicateModal
        isOpen={!!duplicateCheck}
        duplicateData={duplicateCheck}
        newQuestion={pendingQuestion}
        onKeepBoth={handleKeepBoth}
        onReplaceExisting={handleReplaceExisting}
        onCancel={handleCancelDuplicate}
      />

      {/* Delete Local Storage & Data Reset Modal */}
      <ResetStorageModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmResetStorage}
        totalQuestions={questions.length}
      />

    </div>
  );
}

export default App;
