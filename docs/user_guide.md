# Placewise - User Guide

This walks through every page and feature of the app in the order you would actually use it, for all three roles: Student, Company (Recruiter), and Admin.

URL when running locally: `http://localhost:5000`

---

## 1. Landing Page

**URL:** `http://localhost:5000` (or `/#/`)

This is the public homepage. No login needed.

What you see:
- Hero banner with two buttons: Login and New Registration
- Live stats pulled from the backend — Registered Students, Verified Companies, Students Placed, Active Drives
- Three portal cards explaining what each role can do (Student, Recruiter, Admin)
- A "Campus Placement Process" section showing the 3-step flow

From here you either log in or register.

---

## 2. Registration

**URL:** `/#/register`

Two types of registration:

### Student Registration
Fill in:
- Email
- Password
- Full name
- Branch (optional)
- CGPA (optional)
- Year (optional)

After submitting, the account is active immediately. You can log in right away.

### Company Registration
Fill in:
- Email
- Password
- Company name
- Industry, location, website, HR contact (optional)

After submitting, the account is in **pending** state. An admin must approve it before you can log in and use the portal. You will see a "pending admin approval" message if you try to log in before approval.

---

## 3. Login

**URL:** `/#/login`

Enter email and password. On success you get redirected to your role's dashboard automatically:
- Admin → `/#/admin/dashboard`
- Company → `/#/company/dashboard`
- Student → `/#/student/dashboard`

If your account is deactivated you get a "account is deactivated" error. If wrong credentials, "invalid credentials".

The token is stored in localStorage. It lasts 15 minutes, after which the app silently redirects you back to login.

---

## Role: Student

### 4. Student Dashboard

**URL:** `/#/student/dashboard`

Shows:
- Your profile summary (name, branch, CGPA, skills)
- Your recent applications with their current status
- A quick link to browse drives

If you haven't filled out your profile yet, it prompts you to do so.

---

### 5. Edit Profile

**URL:** `/#/student/profile`

From the navbar: **Profile**

Fields you can update:
- Full name
- Branch
- CGPA
- Year
- Phone
- Skills (comma-separated, e.g. `Python, SQL, React`) — this is used for ATS matching
- LinkedIn URL

You can also upload your resume (PDF). This is stored server-side and can be accessed by companies.

Save → hits `PUT /api/student/profile`

---

### 6. Browse Drives

**URL:** `/#/student/drives`

From the navbar: **Browse Drives**

Shows all placement drives that are:
- Approved by admin
- Deadline not yet passed

Each drive card shows:
- Job title and company name
- Job description
- Branch eligibility, Min CGPA, Package/CTC, Application deadline

**Filtering:**
- Search bar filters by job title or company name
- Branch chips at the top filter by CS / IT / Electronics / Mechanical
- Clicking "All Branches" resets the filter

**Check Match (ATS):**

Before applying, you can click "Check Match" on any drive. This runs an ATS check that compares your skill keywords against the job requirements. It shows:
- Match score (percentage)
- Which keywords matched

This helps you know whether it's worth applying before you do.

**Apply Now:**

Click "Apply Now" on a drive card. One click, no form. The button becomes "Applied" (greyed out) once submitted. You can only apply once per drive.

---

### 7. My Applications

**URL:** `/#/student/applications`

From the navbar: **My Applications**

Lists every drive you have applied to with:
- Company name and job title
- Current status badge
- Interview date (if set by the company)
- Feedback from the company (if any)
- Placement details (salary, joining date) if you have been placed

**Status progression you'll see:**

```
applied → shortlisted → interview → offer → placed
                                          ↘ rejected (at any stage)
```

You cannot do anything on this page to change the status — that is controlled entirely by the company. This page is read-only for students.

---

## Role: Company (Recruiter)

### 8. Company Dashboard

**URL:** `/#/company/dashboard`

From the navbar: **Dashboard**

Lists all drives your company has posted. Each card shows:
- Job title
- Drive status (pending / approved / closed)
- Package / CTC
- Application deadline
- Number of applicants so far

Click "Review Applicants" on any drive to go to that drive's application page.

A "+ Post New Drive" button is in the top right corner.

---

### 9. Post a New Drive

**URL:** `/#/company/drives/create`

From the navbar: **Post Drive**

Fill in:
- Job title (required)
- Job description
- Eligibility: branch, minimum CGPA, year
- Salary / CTC
- Application deadline (required, must be a future date — format: YYYY-MM-DD)

Submit → drive is created with status `pending`. An admin must approve it before students can see it.

---

### 10. View Applicants for a Drive

**URL:** `/#/company/drives/:id/applications`

Accessible from "Review Applicants" on the dashboard.

Lists all students who applied. For each applicant:
- Student name and their current application status
- ATS score / skill match ranking (click "ATS Rank" to sort all applicants by match score)
- Option to view the student's full profile

**Moving an application through the pipeline:**

Select the new status from the dropdown next to each applicant and save:
- `applied` → `shortlisted` or `rejected`
- `shortlisted` → `interview` or `rejected`
- `interview` → `offer` or `rejected`
- `offer` → `placed` or `rejected`

You cannot skip stages. Trying to jump from `applied` to `offer` directly will return an error.

**When setting to `interview`:** You can also set an interview date/time (ISO format).

**When setting to `placed`:** You provide salary and joining date. A Placement record is created automatically.

**Add feedback:** You can type company feedback for any application at any time.

**Export applicant list:**

There is an "Export CSV" button. This triggers a background Celery task. After clicking it you get a `task_id`. You can poll the task status — once done, a download link is returned. Requires Celery worker to be running.

**ATS Ranking:**

Click "ATS Rank" to get all applicants sorted by their skill keyword match score against your drive's requirements. Useful for shortlisting without manually reviewing each profile.

---

## Role: Admin

### 11. Admin Dashboard

**URL:** `/#/admin/dashboard`

From the navbar: **Dashboard**

Top section: 4 stat cards
- Total Students
- Total Companies
- Total Drives
- Total Applications

If there are pending companies or drives awaiting review, a yellow warning banner appears at the top with quick links to the relevant management page.

Bottom section: 2 charts
- **Bar chart:** Applications per Drive (top 5 drives)
- **Doughnut chart:** Hired vs Unplaced students

Three shortcut cards link to Companies, Students, and Drives management.

---

### 12. Manage Companies

**URL:** `/#/admin/companies`

From the navbar: **Companies**

Lists every registered company. Search bar filters by company name.

Actions per company:
- **Approve** — unlocks the company's account so they can post drives
- **Reject** — marks registration as rejected
- **Blacklist** — deactivates the account even if previously approved
- **Activate** — re-enables a blacklisted company

A company must be approved before their drives become visible or their login works.

---

### 13. Manage Students

**URL:** `/#/admin/students`

From the navbar: **Students**

Lists all registered students. Search bar works across name, email, phone, and student ID number.

Click on any student row to see their full profile + all their applications.

Actions:
- **Blacklist** — deactivates student account
- **Activate** — re-enables a blacklisted student

---

### 14. Manage Drives

**URL:** `/#/admin/drives`

From the navbar: **Drives**

Lists all placement drives from all companies. Filter by status (pending / approved / closed) using the dropdown.

Actions:
- **Approve** — makes the drive visible to students (can only approve from `pending`)
- **Reject** — rejects a pending drive
- **Close** — closes an approved drive manually (students can no longer apply)

---

## What Happens in the Background (Celery)

These run without any user action needed — they just need the Celery worker and beat scheduler running.

| What | When | Who gets emailed |
|------|------|-----------------|
| Deadline reminder | Daily | Students whose applied drives have a deadline within 3 days |
| Interview reminder | Daily | Students with an interview scheduled within the next 24 hours |
| Monthly report | First of each month | Admin — a summary of placement stats |

---

## Full Feature Checklist by Role

### Student
- [x] Register
- [x] Login / logout
- [x] Edit profile (name, branch, CGPA, year, skills, phone, LinkedIn)
- [x] Upload resume
- [x] Browse all open drives
- [x] Filter drives by branch and search by title/company
- [x] Check ATS keyword match score before applying
- [x] Apply to a drive (one click)
- [x] View all applications and their statuses
- [x] See interview date and company feedback
- [x] See placement details once placed

### Company (Recruiter)
- [x] Register (pending admin approval)
- [x] Login / logout
- [x] View own drives and applicant count
- [x] Post a new placement drive
- [x] Review all applicants for each drive
- [x] Move applicants through the status pipeline
- [x] Set interview date when moving to interview stage
- [x] Add feedback for any applicant
- [x] View applicant's full student profile
- [x] ATS rank all applicants by skill match score
- [x] Export applicant list as CSV (background task)

### Admin (Placement Cell)
- [x] Login / logout
- [x] Dashboard stats and charts
- [x] View pending company registrations and approve/reject
- [x] Blacklist or reactivate any company
- [x] Search and view all students
- [x] View a student's applications
- [x] Blacklist or reactivate any student
- [x] Review pending drives and approve/reject/close
- [x] Receive automated monthly placement reports

---

## URL Reference

| Page | URL |
|------|-----|
| Landing | `/#/` |
| Login | `/#/login` |
| Register | `/#/register` |
| Admin Dashboard | `/#/admin/dashboard` |
| Manage Companies | `/#/admin/companies` |
| Manage Students | `/#/admin/students` |
| Manage Drives | `/#/admin/drives` |
| Company Dashboard | `/#/company/dashboard` |
| Post Drive | `/#/company/drives/create` |
| View Applicants | `/#/company/drives/:id/applications` |
| Student Dashboard | `/#/student/dashboard` |
| Browse Drives | `/#/student/drives` |
| My Applications | `/#/student/applications` |
| Edit Profile | `/#/student/profile` |
