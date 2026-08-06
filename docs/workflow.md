# Placewise2 - Placement Portal (PPA-V2)

A full-stack placement portal with role-based access for admins, companies, and students. Backend is Flask + SQLite + Redis + Celery. Frontend is a single-page app served as static files.

---

## Project Structure

```
placewise2/
├── backend/
│   ├── app.py              # Flask app factory
│   ├── run.py              # Entry point
│   ├── config.py           # All config (DB, JWT, Celery, Mail)
│   ├── models.py           # SQLAlchemy models
│   ├── extensions.py       # db, jwt, celery instances
│   ├── decorators.py       # role_required decorator
│   ├── cache.py            # Redis caching helpers
│   ├── ats.py              # ATS resume scoring logic
│   ├── seed.py             # Database seeder
│   ├── celery_worker.py    # Celery app entry point
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py         # Login, register, token refresh
│   │   ├── admin.py        # Admin dashboard, approvals
│   │   ├── company.py      # Company drives, applications
│   │   └── student.py      # Student profile, job search, apply
│   └── tasks/
│       ├── reminders.py    # Celery tasks: deadline & interview reminders
│       ├── exports.py      # Celery tasks: CSV exports
│       └── reports.py      # Celery tasks: monthly report generation
└── frontend/
    ├── index.html          # Single-page app shell
    ├── app.js              # Frontend JS
    └── assets/
```

---

## Prerequisites

- Python 3.10+
- Redis (must be running on port 6379)
- pip

### Install Redis (Arch Linux)

```bash
sudo pacman -S redis
sudo systemctl enable --now redis
```

Verify it works:

```bash
redis-cli ping
# should return: PONG
```

---

## Setup

### 1. Create virtual environment

```bash
cd placewise2/backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables (optional)

The app works with defaults for local development, but for production you should set these:

```bash
export SECRET_KEY="your-secret-key"
export JWT_SECRET_KEY="your-jwt-key"
export MAIL_USERNAME="your@gmail.com"
export MAIL_PASSWORD="your-app-password"
```

If you skip this, it uses the hardcoded defaults from `config.py` — fine for local testing.

### 4. Seed the database

This creates the DB tables and adds test users:

```bash
python seed.py
```

Default credentials created:

| Role    | Email                   | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@ppa.com           | admin123     |
| Student | student@ppa.com         | student123   |
| Company | recruiter@google.com    | company123   |

---

## Running the Application

You need three separate terminals for full functionality.

### Terminal 1 — Flask server

```bash
cd placewise2/backend
source venv/bin/activate
python run.py
```

Server starts at `http://localhost:5000`.

The frontend is served as static files from the `frontend/` folder, so opening `http://localhost:5000` in your browser loads the app.

### Terminal 2 — Celery worker

Handles background tasks like CSV exports and email reminders.

```bash
cd placewise2/backend
source venv/bin/activate
celery -A celery_worker.celery worker --loglevel=info
```

### Terminal 3 — Celery Beat (scheduler)

Runs periodic tasks on a schedule (daily reminders, monthly reports).

```bash
cd placewise2/backend
source venv/bin/activate
celery -A celery_worker.celery beat --loglevel=info
```

> If you only want to test the API and don't need background tasks, you can skip terminals 2 and 3.

---

## Running Tests

```bash
cd placewise2/backend
source venv/bin/activate
pytest tests/ -v
```

To run a specific test file:

```bash
pytest tests/test_auth.py -v
pytest tests/test_admin.py -v
```

All tests use an in-memory SQLite DB so they don't touch your actual data.

---

## API Overview

Base URL: `http://localhost:5000/api`

### Auth endpoints (`/api/auth`)

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | `/login`                  | Login, returns JWT tokens      |
| POST   | `/register/student`       | Register a new student         |
| POST   | `/register/company`       | Register a company (needs admin approval) |
| POST   | `/refresh`                | Get new access token using refresh token |
| GET    | `/me`                     | Get current logged-in user info |
| GET    | `/public/stats`           | Public stats (no auth needed)  |

### Admin endpoints (`/api/admin`) — requires admin JWT

| Method        | Endpoint                                 | Description                        |
|---------------|------------------------------------------|------------------------------------|
| GET           | `/dashboard`                             | Stats overview (cached 2 min)      |
| GET           | `/companies`                             | List all companies (search by name)|
| PATCH/POST    | `/companies/<id>/approve`                | Approve a company                  |
| PATCH/POST    | `/companies/<id>/reject`                 | Reject a company                   |
| PATCH/POST    | `/companies/<id>/blacklist`              | Deactivate a company               |
| PATCH/POST    | `/companies/<id>/activate`               | Reactivate a company               |
| GET           | `/students`                              | List all students (search by name/email/ID) |
| GET           | `/students/<id>`                         | View student profile + applications|
| PATCH/POST    | `/students/<id>/blacklist`               | Deactivate a student               |
| PATCH/POST    | `/students/<id>/activate`                | Reactivate a student               |
| GET           | `/drives`                                | List all placement drives          |
| PATCH/POST    | `/drives/<id>/approve`                   | Approve a drive                    |
| PATCH/POST    | `/drives/<id>/reject`                    | Reject a drive                     |
| PATCH/POST    | `/drives/<id>/close`                     | Close a drive                      |
| GET           | `/applications`                          | All applications                   |
| GET           | `/placements`                            | All confirmed placements           |
| GET           | `/stats/charts`                          | Chart data for dashboard           |

### Company endpoints (`/api/company`) — requires company JWT + approved status

| Method     | Endpoint                              | Description                            |
|------------|---------------------------------------|----------------------------------------|
| GET        | `/profile`                            | Get company profile                    |
| PUT        | `/profile`                            | Update company profile                 |
| GET        | `/drives`                             | List own drives                        |
| POST       | `/drives`                             | Create a new placement drive           |
| PATCH      | `/drives/<id>/close`                  | Close a drive                          |
| GET        | `/drives/<id>/applications`           | View applicants for a drive            |
| PATCH/POST | `/applications/<id>/status`           | Move application through the pipeline  |
| GET        | `/applications/<id>/student`          | View applicant's student profile       |
| POST       | `/drives/<id>/export`                 | Trigger CSV export (Celery task)       |
| GET        | `/tasks/<task_id>`                    | Check Celery task status               |
| GET        | `/drives/<id>/ats-rank`               | ATS skill-match ranking for a drive    |

### Student endpoints (`/api/student`) — requires student JWT

| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/profile`                 | Get own profile                          |
| PUT    | `/profile`                 | Update profile (branch, CGPA, skills...) |
| POST   | `/resume`                  | Upload resume (multipart/form-data)      |
| GET    | `/drives`                  | Browse approved, open placement drives   |
| POST   | `/drives/<id>/apply`       | Apply to a placement drive               |
| GET    | `/applications`            | View own applications                    |
| GET    | `/placements`              | View confirmed placements                |

---

## Application Status Flow

When a student applies to a drive, the application goes through these stages:

```
applied → shortlisted → interview → offer → placed
                ↘              ↘         ↘        ↘
               rejected      rejected  rejected  (terminal)
```

Only a company can move an application between states. Each transition must follow the allowed path above — you cannot skip stages.

When an application reaches `placed`, a `Placement` record is automatically created.

---

## Background Tasks

Celery handles three scheduled/async tasks:

| Task | Schedule | What it does |
|------|----------|--------------|
| `send_deadline_reminders` | Daily | Emails students whose applied drives have a deadline within 3 days |
| `send_interview_reminders` | Daily | Emails students with an interview scheduled within 24 hours |
| `generate_monthly_report` | Monthly | Generates a placement stats report and emails admin |

For email to work, set `MAIL_USERNAME` and `MAIL_PASSWORD` in your environment. Gmail users need to generate an App Password (not your regular password) from Google Account settings.

CSV export tasks (`export_company_drive_csv`) are triggered on-demand via the API. The company polls `/api/company/tasks/<task_id>` to check if the export is done.

---

## Database Models

| Model          | Key fields |
|----------------|------------|
| `User`         | email, password_hash, role (`admin`/`company`/`student`), is_active |
| `Student`      | full_name, branch, cgpa, year, skills, resume_path |
| `Company`      | name, industry, location, approval_status (`pending`/`approved`/`rejected`) |
| `PlacementDrive` | job_title, eligibility_cgpa, application_deadline, status (`pending`/`approved`/`closed`) |
| `Application`  | student_id, drive_id, status, interview_date, company_feedback |
| `Placement`    | application_id, salary, joining_date, offer_letter_path |

---

## Common Mistakes / Things to Know

**JWT tokens** — Access tokens expire in 15 minutes (`JWT_ACCESS_TOKEN_EXPIRES = 900`). Use `/api/auth/refresh` with the refresh token to get a new one. Refresh tokens last 7 days.

**Company registration** — After a company registers, an admin must approve it before the company can log in and use any endpoints. The approval status starts as `pending`.

**Drive approval** — Same as companies. A company creates a drive, it starts as `pending`, and an admin must approve it before students can see and apply to it.

**Celery without Redis** — If Redis isn't running, Celery and the export/reminder features won't work, but the main Flask app will still run fine. You'll see connection errors in the logs if you try to trigger async tasks.

**Logs** — Application logs are written to `backend/logs/ppa.log` with rotation (max 1MB, 10 backups).

**Static files** — The Flask app serves the frontend from `../frontend/`. If you add new files to the frontend, no rebuild is needed, just refresh the browser.

---

## Quick Start (TL;DR)

```bash
# 1. Start Redis
sudo systemctl enable --now redis

# 2. Setup
cd placewise2/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python seed.py

# 3. Run the app
python run.py

# 4. (Optional) In separate terminals
celery -A celery_worker.celery worker --loglevel=info
celery -A celery_worker.celery beat --loglevel=info

# 5. Open browser
# http://localhost:5000
```

Login with `admin@ppa.com / admin123` to get started.
