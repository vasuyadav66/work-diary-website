# 📖 Daily Work Diary Web App (School Almanac & Work Log)

A modern, responsive web application inspired by traditional school diaries/notebooks to track your daily tasks, homework, and work activities with accurate automatic timestamps and audio/desktop reminders.

---

## ✨ Features

- **School Diary / Notebook Aesthetic**:
  - Classic diary ledger layout with subject tags, priorities, and clean notebook styling.
  - Live digital clock with seconds, day, month, date, and year in the header.
- **Accurate Automatic Timestamps**:
  - Every work entry automatically captures and saves the exact **Year, Month, Date, Day of the Week, and Time** (e.g., `Monday, 19 October 2026 at 09:30 AM`).
- **Reminders & Alarms ("Remember me with time")**:
  - Set specific reminder times (or quick +15m, +30m, +1h buttons).
  - Built-in Web Audio API melodic chime sound synthesizer (no external audio files needed).
  - Browser desktop notifications (works even if you are on another tab).
  - Interactive popup alarm banner with options to "Mark Done" or "Dismiss".
- **Diary Management**:
  - Categorize by Homework, Classwork, Project, Revision, Office Work, Personal, etc.
  - Set priority (Normal, Medium, High, Urgent).
  - Mark completed with satisfying checkmark and strikethrough.
  - Delete entries anytime.
- **Ledger Filtering & Search**:
  - Filter by **Today's Page**, **Full Diary History**, or choose any specific date on the calendar.
  - Filter by Category or Completion Status.
  - Real-time search across task titles and notes.
- **Print Diary Page**:
  - Ready-to-print view formatted like a physical school diary ledger page.

---

## 🚀 How to Run

1. Open your terminal in this project folder:
   ```bash
   cd "C:\Users\User\.gemini\antigravity\scratch\work_diary"
   ```

2. (Optional) Install dependencies if needed:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the Flask application:
   ```bash
   python app.py
   ```

4. Open your browser and visit:
   ```
   http://127.0.0.1:5000
   ```

---

## 🗂️ Project Structure

```
work_diary/
├── app.py                 # Flask server with SQLite database & REST API
├── requirements.txt       # Dependencies (Flask)
├── work_diary.db          # SQLite persistent database
├── templates/
│   └── index.html         # School diary HTML interface
└── static/
    ├── css/
    │   └── style.css      # Custom styling, notebook aesthetic & animations
    └── js/
        └── app.js         # Real-time clock, Web Audio chime, notifications & AJAX
```
