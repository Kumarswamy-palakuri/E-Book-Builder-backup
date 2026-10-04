# ExamMCQ Maker (తెలుగు & English Bilingual Math EBook Creator)

A fast, responsive, standalone React web application designed for creating, curating, and printing competitive exam mathematics e-books in Telugu & English bilingual formats.

---

## ✨ Features

- **Pure Client-Side React SPA**: Runs completely in the browser with fast client-side navigation and no external server dependencies.
- **29 Standard Chapters & Subsections**: Pre-configured chapters with Telugu and English titles and topics.
- **Bilingual MCQ Builder**: Side-by-side English and Telugu question authoring with LaTeX / KaTeX math formula rendering.
- **Bulk Import**: Import questions in bulk with flexible structured text or Excel/CSV sheets.
- **Duplicate Question Detection**: Similarity checker based on Levenshtein and n-gram distance to prevent duplicate questions.
- **Browser Persistence**: Reliable LocalStorage data persistence for books, chapters, questions, drafts, and styling settings.
- **Print & PDF Studio**: Built-in 2-column book styling, cover page design, table of contents, answer key, and detailed solutions ready for PDF export or printing.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```
ebook maker/
├── index.html               # Entry HTML page
├── package.json             # React & Vite dependencies
├── vite.config.js           # Vite configuration
├── public/                  # Static assets
└── src/
    ├── main.jsx             # React entry point
    ├── App.jsx              # Main application state and tabs
    ├── index.css            # Tailwind & custom typography styles
    ├── components/          # UI components (Navbar, QuestionBuilder, QuestionBank, etc.)
    ├── data/                # Default chapters and sample bilingual questions
    ├── pdf/                 # PDF styling and book generator templates
    └── utils/               # Storage (LocalStorage), Duplicate Checker, Parsers, KaTeX
```
