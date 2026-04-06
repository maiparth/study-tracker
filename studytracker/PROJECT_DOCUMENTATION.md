# StudyTracker

## Web-Based Pomodoro Study Dashboard

WPL Mini Project - Developer Documentation

## Tech Stack

Python 3 · Django · SQLite · HTML5 · CSS3 · JavaScript

## Team Members

| Sl. | Name | Batch | Roll No. | Reg. No. |
| --- | --- | --- | --- | --- |
| 1 | Prahlad Gaitonde | C2 | 44 | 230962262 |
| 2 | Kumar Satyam | C2 | 37 | 230962226 |
| 3 | Parth Niraj Kumar | C2 | 38 | 230962228 |

## 1. Project Overview

StudyTracker is a three-page Django web application designed to help students study using the Pomodoro technique. It tracks time spent on tasks, records completed sessions in SQLite, and provides a PDF resource library for uploading, viewing, downloading, and managing study files.

### 1.1 What is the Pomodoro Technique?

The Pomodoro technique is a time-management method by Francesco Cirillo. Work is split into focused intervals (typically 25 minutes), separated by short breaks (typically 5 minutes). In this project, the cycle repeats until the user clicks Done.

### 1.2 The Three Pages

| Page | Purpose |
| --- | --- |
| / | Pomodoro timer: task input, start/stop/resume, done |
| /stats/ | Session analytics: totals, chart, daily/weekly/monthly summaries, history |
| /resources/ | PDF library: upload, filter, view, download, delete |

### 1.3 Technology Summary

| Layer | Technology |
| --- | --- |
| Language | Python 3.x |
| Web Framework | Django (MTV pattern) |
| Database | SQLite 3 (`db.sqlite3`) |
| Frontend | Django Templates + HTML5 + CSS3 + Vanilla JS |
| File Storage | Django `FileField` in `media/pdfs/` |
| Async Save | Fetch API to `/save-session/` |

## 2. File and Folder Structure

```text
studytracker/
├── manage.py
├── db.sqlite3
├── media/
│   └── pdfs/
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── timer.js
│       └── main.js
├── studytracker/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── tracker/
    ├── __init__.py
    ├── forms.py
    ├── models.py
    ├── urls.py
    ├── views.py
    ├── migrations/
    │   └── 0001_initial.py
    └── templates/tracker/
        ├── base.html
        ├── home.html
        ├── stats.html
        └── resources.html
```

## 3. Database Models (`tracker/models.py`)

### 3.1 StudySession

Stores one record each time a user clicks Done on a task.

| Field | Type | Purpose |
| --- | --- | --- |
| id | BigAutoField | Primary key |
| task_name | CharField(255) | Task entered by user |
| completed_at | DateTimeField | Completion timestamp |
| time_taken_seconds | IntegerField | Wall-clock time elapsed |
| pomodoros_completed | IntegerField | Number of completed focus rounds |

Computed helper:
- `time_taken_display` returns a human-readable string such as `47m 12s` or `1h 3m 8s`.

Ordering:
- Newest first (`ordering = ['-completed_at']`).

### 3.2 StudyResource

Stores uploaded PDF metadata and path.

| Field | Type | Purpose |
| --- | --- | --- |
| id | BigAutoField | Primary key |
| title | CharField(255) | Display title |
| subject | CharField(100, blank=True) | Subject/filter label |
| description | TextField(blank=True) | Optional notes |
| pdf_file | FileField(upload_to='pdfs/') | PDF file reference |
| uploaded_at | DateTimeField | Upload timestamp |

Ordering:
- Newest first (`ordering = ['-uploaded_at']`).

## 4. URL Routing

Routing is split across project-level and app-level URL files.

### 4.1 Root (`studytracker/urls.py`)

- Includes `tracker.urls` at root path.
- Serves media in development via `static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`.

### 4.2 App (`tracker/urls.py`)

| URL | View | Name | Method |
| --- | --- | --- | --- |
| / | `home` | home | GET |
| /stats/ | `stats` | stats | GET |
| /resources/ | `resources` | resources | GET |
| /save-session/ | `save_session` | save_session | POST |
| /upload-resource/ | `upload_resource` | upload_resource | POST |
| /resource/view/<pk>/ | `view_resource` | view_resource | GET |
| /resource/download/<pk>/ | `download_resource` | download_resource | GET |
| /delete-resource/<pk>/ | `delete_resource` | delete_resource | GET |
| /delete-session/<pk>/ | `delete_session` | delete_session | GET |

## 5. Views (`tracker/views.py`)

### 5.1 `home(request)`

Renders timer page (`home.html`).

### 5.2 `save_session(request)`

AJAX endpoint for saving completed sessions from JavaScript.

Input JSON keys:
- `task_name`
- `time_taken_seconds`
- `pomodoros`

Response:
- Success: `{status: "ok", id: <session_id>}`
- Validation/method errors with HTTP status 400/405.

### 5.3 `stats(request)`

Builds analytics for the stats page:
- Optional date range filters (`start_date`, `end_date`)
- Summary totals (sessions, total time, pomodoros, average)
- Daily aggregation (`TruncDate`) for chart/table
- Weekly aggregation (`TruncWeek`)
- Monthly aggregation (`TruncMonth`)

### 5.4 `resources(request)`

Loads resources list and subject filters, optionally filtered by `?subject=` query parameter.

### 5.5 `upload_resource(request)`

Handles multipart upload form submission.
- Valid saves file and metadata
- Invalid returns same page with field errors and message

### 5.6 `view_resource(request, pk)`

Serves PDF inline using `FileResponse` with `Content-Disposition: inline`.

### 5.7 `download_resource(request, pk)`

Serves PDF as attachment download using `FileResponse(as_attachment=True)`.

### 5.8 Delete Views

- `delete_resource(request, pk)` deletes file and DB row
- `delete_session(request, pk)` deletes session row

## 6. Templates

### 6.1 `base.html`

Shared shell:
- Navbar with links to Timer, Stats, Resources
- Shared stylesheet include
- Shared JS include (`main.js`)
- Block placeholders for page content and extra scripts

### 6.2 `home.html`

Contains:
- Task input section
- Timer section with SVG ring
- Break and completion modal UIs
- Injected constants:
  - `CSRF_TOKEN`
  - `SAVE_URL`

### 6.3 `stats.html`

Contains:
- Date range filter form
- Summary cards
- Daily trend line chart canvas
- Daily summary table
- Weekly summary table
- Monthly summary table
- Session history table

### 6.4 `resources.html`

Contains:
- Upload form with validation errors/messages
- Subject filter chips
- Resource cards with View, Download, Delete actions

## 7. JavaScript

### 7.1 `static/js/timer.js`

Implements timer state machine and persistence.

Core states:
- Focus mode vs break mode
- Remaining seconds
- Total elapsed seconds
- Pomodoro count
- Running/paused

Persistence behavior:
- Saves timer state in `localStorage` (`studytracker.timerState`)
- Restores state when user returns to timer page
- Does not reset when switching to Stats/Resources
- Clears state only when user clicks Done and resets task

Core flow:
1. Start task
2. Focus countdown
3. Break countdown
4. Repeat until Done
5. Save session to backend via Fetch API

### 7.2 `static/js/main.js`

Shared utility behavior for safe modal overlay closes.

## 8. Styling (`static/css/style.css`)

Single-file CSS system using custom properties (`:root`) for colors, spacing, and radius.

Key characteristics:
- Lo-fi warm visual theme
- Responsive layouts for all pages
- SVG ring countdown animation via `stroke-dashoffset`
- Styles for chart sections, summary tables, upload messages, and resource cards

## 9. Form Validation (`tracker/forms.py`)

`StudyResourceForm` validates uploads with:
- file picker accept hint (`.pdf,application/pdf`)
- `clean_pdf_file()` checks:
  - extension must be `.pdf`
  - content type must be PDF when present

## 10. Configuration (`studytracker/settings.py`)

| Setting | Current Value | Notes |
| --- | --- | --- |
| DEBUG | True | Use False in production |
| ALLOWED_HOSTS | `['*']` | Restrict in production |
| TIME_ZONE | `Asia/Kolkata` | Local timezone setting |
| DATABASE | SQLite (`db.sqlite3`) | Suitable for development |
| MEDIA_ROOT | `BASE_DIR / 'media'` | Uploaded files |
| MEDIA_URL | `/media/` | Media URL prefix |
| STATIC_URL | `/static/` | Static URL prefix |
| STATICFILES_DIRS | `[BASE_DIR / 'static']` | Static source folder |

## 11. Setup and Run

### 11.1 Environment Setup

```bash
cd studytracker
python3 -m venv venv
source venv/bin/activate
pip install django
python manage.py migrate
```

### 11.2 Run Server

```bash
python manage.py runserver
```

Open:
- `http://127.0.0.1:8000/`

If port 8000 is busy:

```bash
python manage.py runserver 8001
```

### 11.3 Health Check

```bash
python manage.py check
```

## 12. End-to-End Data Flow

### 12.1 Timer Completion Flow

1. User opens `/` and starts a task.
2. Browser runs timer logic and tracks elapsed time.
3. On Done, JS posts JSON to `/save-session/`.
4. Backend creates `StudySession` row.
5. User opens `/stats/` and sees updated aggregates/chart/history.

### 12.2 Resource Upload and Access Flow

1. User uploads PDF on `/resources/`.
2. Form validates file type and content.
3. Django stores file in `media/pdfs/` and metadata in DB.
4. View action calls `/resource/view/<pk>/` for inline open.
5. Download action calls `/resource/download/<pk>/` for attachment.
6. Delete action removes file and database record.

## 13. Troubleshooting

| Problem | Cause and Fix |
| --- | --- |
| `No module named django` | Activate virtual env and run `pip install django` |
| Templates not loading | Confirm `tracker` in `INSTALLED_APPS` |
| PDF returns 404 | Check media URL config and file existence under `media/pdfs/` |
| Static changes not visible | Hard refresh browser (`Ctrl+Shift+R`) |
| New model field errors | Run `makemigrations` and `migrate` |

## 14. Future Improvements

- Add authentication and user-specific data isolation
- Add resource search and pagination
- Add CSV export for filtered stats
- Add automated tests for upload, analytics, and timer API
- Add production deployment stack (PostgreSQL, Gunicorn, Nginx)

---

Document prepared for WPL Mini Project, Batch C2.
