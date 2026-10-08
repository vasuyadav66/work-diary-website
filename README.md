# My Work Diary Website

My Work Diary is a simple Python Flask web application for saving daily work,
tasks, assignments, and reminders in one clean place. It is inspired by the way
students maintain a school diary, but it is renamed and designed as a work diary
so it can be used for personal tasks, study work, project work, or daily plans.

The app lets you enter a work title, subject/category, reminder date and time,
and detailed notes. Every saved entry also stores the exact date and time when it
was created, so you can see when you added the work and when it should be done.

## About This Application

This application is useful when you want to remember your work with proper date
and time details. Instead of writing tasks on paper, you can save them in the
browser and keep them organized. The home page shows a summary of all saved work,
today's work, due work, and completed work.

It is built for local use with Python and Flask. The data is stored in a JSON
file on your computer, so you do not need a database to run it.

## Features

- Add work with title, subject, notes, reminder date, and reminder time.
- Save the exact created date and time for every entry.
- View all saved work in a clean card layout.
- See quick summary counts for total work, today's work, due work, and completed
  work.
- Mark any work item as done or pending.
- Delete work items that are no longer needed.
- Store diary data locally in a JSON file.
- Responsive design that works on desktop and smaller screens.

## Tech Stack

- Python
- Flask
- HTML
- CSS
- JSON file storage

## Project Structure

```text
work-diary-website/
├── app.py
├── requirements.txt
├── README.md
├── static/
│   └── styles.css
├── templates/
│   └── index.html
└── data/
    └── diary_entries.json
```

The `data/diary_entries.json` file is created automatically when entries are
saved. It is ignored by Git so your personal diary data is not pushed to GitHub.

## Installation

Clone the repository:

```powershell
git clone https://github.com/vasuyadav66/work-diary-website.git
cd work-diary-website
```

Install the required Python package:

```powershell
python -m pip install -r requirements.txt
```

## Run the Application

Start the Flask development server:

```powershell
python app.py
```

Then open this URL in your browser:

```text
http://127.0.0.1:5000
```

On Windows, you can also double-click:

```text
start_work_diary.bat
```

That file moves into the project folder, installs requirements if needed, and
starts the local server.

## How to Use

1. Enter the work title.
2. Add a subject or category.
3. Select the reminder date and time.
4. Write any extra notes.
5. Click `Save Work`.
6. Use `Mark Done` when the work is completed.
7. Use `Delete` to remove work you no longer need.

The date shown at the top updates automatically from your computer clock when
you open the website. The reminder field also starts with the current date and
time, so every new entry is ready for today's work.

## Data Storage

This app stores diary entries in:

```text
data/diary_entries.json
```

Each entry includes:

- Unique entry ID
- Work title
- Subject/category
- Notes
- Reminder date and time
- Created date and time
- Completion status

## Future Improvements

- Add browser notifications for reminders.
- Add search and filter options.
- Add user login.
- Add calendar view.
- Add edit option for saved work.
- Add deployment support for online hosting.

## Author

Created by [vasuyadav66](https://github.com/vasuyadav66).
