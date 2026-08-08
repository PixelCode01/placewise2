# Placement Portal Application - V2

A web application designed for institutes to manage campus recruitment activities involving institute placement cells (Admin), registered companies, and participating students.

## Architecture & Tech Stack

- **Backend**: Python 3, Flask REST API
- **Authentication**: JWT (Flask-JWT-Extended) with Role-Based Access Control
- **Database**: SQLite with SQLAlchemy ORM
- **Frontend**: Vue.js 3 (CDN), Vue Router 4 (CDN) Single Page Application
- **Styling**: Bootstrap 5.3 + Vanilla CSS (No non-permitted CSS frameworks)
- **Caching**: Redis Cache with TTL and mutation-based invalidation
- **Async & Periodic Tasks**: Celery Worker + Celery Beat + Redis Message Broker
- **Analytics & ATS**: Chart.js data visualizations and keyword-based ATS resume screener

---

## User Roles & Key Features

### 1. Admin (Institute Placement Cell)
- Pre-existing superuser initialized programmatically (`admin@ppa.com` / `admin123`).
- Review and approve/reject newly registered companies.
- Review and approve/reject company-submitted placement drives.
- Search and manage all students and companies.
- Blacklist/deactivate companies or students.
- System analytics with interactive placement and application charts.

### 2. Company
- Self-registration with admin verification workflow.
- Create placement drives with branch, CGPA, and year eligibility criteria.
- View and manage candidate applications for each drive.
- Progress candidate applications through lifecycle stages: `applied` -> `shortlisted` -> `interview` -> `offer` -> `placed` / `rejected`.
- Schedule interview dates and record placement confirmation details.
- ATS rank matching for drive applicants.

### 3. Student
- Self-registration, profile management, and resume upload (`.pdf`, `.doc`, `.docx`).
- Browse approved placement drives with search and eligibility filter.
- Apply to drives (automated eligibility validation and duplicate prevention).
- Track application status, interview schedules, feedback, and placement records.
- Trigger asynchronous background CSV export of application history.
- Pre-check resume fit using the ATS screener.

---

## Project Structure

```
placewise2/
├── backend/
│   ├── app.py              # Flask app factory, blueprints, and error handlers
│   ├── config.py           # Application configurations (DB, JWT, Redis, Celery)
│   ├── extensions.py       # SQLAlchemy, JWT, and Celery instances
│   ├── models.py           # Database models (User, Company, Student, Drive, Application, Placement)
│   ├── seed.py             # Database creation and admin seeder
│   ├── cache.py            # Redis caching helpers
│   ├── ats.py              # ATS resume scoring engine
│   ├── celery_worker.py    # Celery app worker configuration
│   ├── decorators.py       # Role-based access control decorator
│   ├── run.py              # Local development server runner
│   ├── requirements.txt    # Python dependencies
│   ├── routes/
│   │   ├── auth.py         # Registration, login, token refresh, public stats
│   │   ├── admin.py        # Admin management and analytics endpoints
│   │   ├── company.py      # Company profile, drives, and candidate actions
│   │   └── student.py      # Student profile, drive browsing, and applications
│   ├── tasks/
│   │   ├── reminders.py    # Daily deadline reminder scheduled task
│   │   ├── reports.py      # Monthly placement activity report task
│   │   └── exports.py      # User-triggered async CSV export task
│   └── tests/
│       ├── conftest.py     # Pytest fixtures and mock client
│       ├── test_admin.py   # Admin management and approval tests
│       ├── test_ats.py     # ATS resume keyword matching tests
│       ├── test_auth.py    # Authentication and registration tests
│       ├── test_company.py # Company drive creation and applicant tests
│       ├── test_student.py # Student profile and application flow tests
│       └── test_tasks.py   # Celery reminders and report tasks tests
└── frontend/
    ├── index.html          # SPA entry point with Bootstrap and fonts
    ├── manifest.json       # PWA manifest for Add to Home Screen
    ├── sw.js               # Service worker for offline caching
    ├── app.js              # Vue app initialization, API client, router guards
    └── components/
        ├── Landing.js      # Public landing page with live placement stats
        ├── auth/           # Login and Registration components
        ├── admin/          # Admin dashboard and management views
        ├── company/        # Company dashboard, drive creator, application review
        └── student/        # Student dashboard, drive browser, profile, applications
```

---

## Local Setup & Execution

### 1. Backend Environment Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Database Initialization

```bash
python seed.py
```
This programmatically creates all SQLite tables and seeds the default admin user:
- Email: `admin@ppa.com`
- Password: `admin123`

### 3. Running Redis

Ensure Redis server is running locally on port 6379:
```bash
redis-server
```

### 4. Running Celery Worker & Beat

In separate terminal tabs with the virtual environment activated:

```bash
# Celery Worker
celery -A celery_worker.celery worker --loglevel=info

# Celery Beat (Scheduler)
celery -A celery_worker.celery beat --loglevel=info
```

### 5. Running the Application

```bash
python run.py
```

Access the application in your browser at `http://localhost:5000`.

---

## Testing

Run automated backend tests using pytest:

```bash
pytest
```
