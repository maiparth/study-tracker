> [!CAUTION]
> This project is **DEVELOPMENT ONLY**. Please make necessary changes if you want to use it in production.
> 
> Risk **<ins>MAJOR SECURITY THREATS</ins>** IF USED IN PRODUCTION

# StudyTracker – WPL Mini Project

A Django-based Pomodoro study tracker with session stats and a PDF resource library.

## Tech Stack
- **Backend:** Python 3, Django, SQLite
- **Frontend:** HTML5, CSS3 (Lo-Fi aesthetic), Vanilla JavaScript, jQuery (optional)
- **Pages:** Home (Timer), Stats, Resources (PDF Library)

---

## Setup Instructions

### 1. Clone / Extract the project
```bash
cd studytracker
```

### 2. Create a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# OR
venv\Scripts\activate           # Windows
```

### 3. Install Django
```bash
pip install django
```

### 4. Apply database migrations
```bash
python manage.py migrate
```

### 5. (Optional) Create an admin superuser
```bash
python manage.py createsuperuser
```

### 6. Run the development server
```bash
python manage.py runserver
```

### 7. Open in your browser
```
http://127.0.0.1:8000/
```

---

## Project Structure

```
studytracker/
├── manage.py
├── db.sqlite3                  ← auto-created after migrate
├── media/
│   └── pdfs/                   ← uploaded PDFs stored here
├── static/
│   ├── css/
│   │   └── style.css           ← Lo-Fi stylesheet
│   └── js/
│       ├── timer.js            ← Pomodoro timer logic
│       └── main.js             ← shared utilities
├── studytracker/               ← project config package
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── tracker/                    ← main Django app
    ├── __init__.py
    ├── models.py               ← StudySession, StudyResource
    ├── views.py                ← home, stats, resources, AJAX save
    ├── urls.py
    ├── forms.py
    ├── migrations/
    │   ├── __init__.py
    │   └── 0001_initial.py
    └── templates/tracker/
        ├── base.html
        ├── home.html           ← Page 1: Pomodoro Timer
        ├── stats.html          ← Page 2: Session Stats
        └── resources.html      ← Page 3: PDF Library
```

---

## Features

### Page 1 – Timer (Home)
- Enter a task name → Start button activates
- 25-minute countdown ring with animated SVG progress
- **Stop** pauses the timer; **Resume** continues
- **Done** marks task complete → saves to DB → shows congratulations modal with time taken & pomodoros
- When 25 mins expire → "Time to Take a Break!" modal with 5-minute countdown
- After break ends → 25-minute focus timer restarts for the same task automatically

### Page 2 – Stats
- Summary cards: total tasks, total study time, total pomodoros, average session time
- Full session history table with task name, completion time, duration, pomodoro count
- Delete individual records

### Page 3 – Resources (PDF Library)
- Upload PDFs with title, subject tag, and description
- Filter by subject using chips
- View PDFs inline in a fullscreen modal iframe
- Download or delete PDFs

---

## Group Members
| Sl. No | Name | Batch | Roll No | Reg No |
|--------|------|-------|---------|--------|
| 1 | Prahlad Gaitonde | C2 | 44 | 230962262 |
| 2 | Kumar Satyam | C2 | 37 | 230962226 |
| 3 | Parth Niraj Kumar | C2 | 38 | 230962228 |
