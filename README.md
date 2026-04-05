readme_content = """# 📚 StudyTracker — WPL Mini Project

A Django-based Pomodoro study tracker with session statistics and a PDF resource library.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.x |
| Web Framework | Django 4.x |
| Database | SQLite 3 |
| Front-end | HTML5, CSS3, Vanilla JavaScript |
| File Storage | Django FileField → `media/pdfs/` |
| AJAX | Fetch API |

---

## 📁 Project Structure

\`\`\`
studytracker/
├── manage.py
├── db.sqlite3                  ← auto-created after migrate
├── media/pdfs/                 ← uploaded PDFs stored here
├── static/
│   ├── css/style.css           ← Lo-Fi stylesheet
│   └── js/
│       ├── timer.js            ← Pomodoro timer logic
│       └── main.js             ← shared utilities
├── studytracker/               ← project config
│   ├── settings.py
│   └── urls.py
└── tracker/                    ← main app
    ├── models.py               ← StudySession, StudyResource
    ├── views.py
    ├── urls.py
    ├── forms.py
    └── templates/tracker/
        ├── base.html
        ├── home.html           ← Page 1: Timer
        ├── stats.html          ← Page 2: Stats
        └── resources.html      ← Page 3: PDF Library
\`\`\`

---

## ⚙️ Setup

\`\`\`bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\\Scripts\\activate

# 2. Install Django
pip install django

# 3. Apply migrations
python manage.py migrate

# 4. (Optional) Create admin superuser
python manage.py createsuperuser

# 5. Run the server
python manage.py runserver
\`\`\`

Open **http://127.0.0.1:8000** in your browser.

---

## ✨ Features

### Page 1 – Timer (`/`)
- Enter a task name → Start button activates
- 25-minute SVG ring countdown
- **Stop** pauses / **Resume** continues
- **Done** saves session to DB and shows a congratulations modal
- When 25 min expire → break modal with 5-min countdown → focus restarts automatically

### Page 2 – Stats (`/stats/`)
- Summary cards: total tasks, total time, total pomodoros, average session time
- Full session history table with delete option

### Page 3 – Resources (`/resources/`)
- Upload PDFs with title, subject, and description
- Filter by subject
- View PDFs inline, download, or delete

---

## 🗄️ Database Models

**StudySession**
| Field | Type | Purpose |
|-------|------|---------|
| task_name | CharField | Name of the task |
| completed_at | DateTimeField | When Done was clicked |
| time_taken_seconds | IntegerField | Wall-clock seconds elapsed |
| pomodoros_completed | IntegerField | Completed 25-min rounds |

**StudyResource**
| Field | Type | Purpose |
|-------|------|---------|
| title | CharField | Display name |
| subject | CharField | Filter tag (e.g. "Maths") |
| description | TextField | Optional notes |
| pdf_file | FileField | Stored in `media/pdfs/` |
| uploaded_at | DateTimeField | Upload timestamp |

---

## 🔗 URL Reference

| URL | View | Purpose |
|-----|------|---------|
| `/` | `home()` | Timer page |
| `/stats/` | `stats()` | Session history |
| `/resources/` | `resources()` | PDF library |
| `/save-session/` | `save_session()` | AJAX POST — save completed task |
| `/upload-resource/` | `upload_resource()` | PDF upload form POST |
| `/delete-resource/<pk>/` | `delete_resource()` | Delete a PDF |
| `/delete-session/<pk>/` | `delete_session()` | Delete a session record |

---

## 🎨 Customisation

**Change timer durations** — edit `static/js/timer.js`:
\`\`\`js
const FOCUS_DURATION = 25 * 60;  // change 25
const BREAK_DURATION =  5 * 60;  // change 5
\`\`\`

**Change the colour theme** — edit `:root` in `static/css/style.css`:
\`\`\`css
:root {
  --accent:  #e07a5f;  /* primary CTA colour */
  --bg:      #fdf6ec;  /* page background     */
}
\`\`\`

---

## 👥 Group Members

| Sl. | Name | Batch | Roll No. | Reg. No. |
|-----|------|-------|----------|----------|
| 1 | Prahlad Gaitonde | C2 | 44 | 230962262 |
| 2 | Kumar Satyam | C2 | 37 | 230962226 |
| 3 | Parth Niraj Kumar | C2 | 38 | 230962228 |
"""

with open("README.md", "w") as f:
    f.write(readme_content)

print("README.md written successfully.")
