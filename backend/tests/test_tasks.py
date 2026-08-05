from datetime import date, timedelta
from werkzeug.security import generate_password_hash
from extensions import db
from models import User, Company, Student, PlacementDrive, Application
from tasks.reminders import is_eligible, send_interview_reminders
from tasks.reports import generate_monthly_report
from tasks.exports import export_company_drive_csv

def test_reminder_eligibility_logic():
    class S:
        cgpa = 8.5
        branch = "CSE"
        year = 4

    class D:
        eligibility_cgpa = 7.5
        eligibility_branch = "CSE,ECE"
        eligibility_year = 4

    eligible, _ = is_eligible(S(), D())
    assert eligible is True

    class S_low:
        cgpa = 6.0
        branch = "CSE"
        year = 4
    eligible, _ = is_eligible(S_low(), D())
    assert eligible is False

def test_monthly_report_generation(app):
    with app.app_context():
        # Setup company, student, drive, application
        cu = User(email="rep_comp@test.com", password_hash=generate_password_hash("pass"), role="company")
        db.session.add(cu)
        db.session.flush()
        c = Company(user_id=cu.id, name="ReportCo", approval_status="approved")
        db.session.add(c)
        db.session.flush()

        d = PlacementDrive(
            company_id=c.id,
            job_title="DevOps Engineer",
            application_deadline=date.today() + timedelta(days=20),
            status="approved"
        )
        db.session.add(d)
        db.session.commit()

        # Run report generation
        result = generate_monthly_report()
        assert "report generated" in result or "Report sent" in result


def test_interview_reminder_task(app):
    with app.app_context():
        result = send_interview_reminders()
        assert "Interview reminders sent" in result

