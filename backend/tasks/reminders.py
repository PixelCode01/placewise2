from extensions import celery
from models import Student, PlacementDrive, Application
from datetime import date, timedelta
import smtplib
from email.mime.text import MIMEText
from flask import current_app


def send_email(to, subject, body):
    username = current_app.config['MAIL_USERNAME']
    password = current_app.config['MAIL_PASSWORD']
    if not username or not password:
        print(f'[MAIL SKIPPED] To: {to} | Subject: {subject}')
        return
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = username
    msg['To'] = to
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(msg)


@celery.task(name='tasks.reminders.send_deadline_reminders')
def send_deadline_reminders():
    soon = date.today() + timedelta(days=3)
    drives = PlacementDrive.query.filter(
        PlacementDrive.status == 'approved',
        PlacementDrive.application_deadline == soon
    ).all()

    sent = 0
    for drive in drives:
        applied_student_ids = {a.student_id for a in drive.applications.all()}
        students = Student.query.all()
        for student in students:
            if student.id in applied_student_ids:
                continue
            if not student.user.is_active:
                continue
            eligible, _ = is_eligible(student, drive)
            if not eligible:
                continue
            subject = f'Reminder: {drive.job_title} at {drive.company.name} closes in 3 days'
            body = (
                f'Hi {student.full_name},\n\n'
                f'The placement drive for {drive.job_title} at {drive.company.name} '
                f'closes on {drive.application_deadline}.\n\n'
                f'Log in to apply: http://localhost:5000\n\nPlacement Portal'
            )
            try:
                send_email(student.user.email, subject, body)
                sent += 1
            except Exception as e:
                print(f'Failed to email {student.user.email}: {e}')

    return f'Reminders sent: {sent}'


@celery.task(name='tasks.reminders.send_interview_reminders')
def send_interview_reminders():
    tomorrow = date.today() + timedelta(days=1)
    apps = Application.query.filter(
        Application.status == 'interview',
        Application.interview_date != None
    ).all()

    sent = 0
    for app in apps:
        if app.interview_date and app.interview_date.date() == tomorrow:
            student = app.student
            if not student or not student.user.is_active:
                continue
            subject = f'Interview Reminder: {app.drive.job_title} at {app.drive.company.name}'
            body = (
                f'Hi {student.full_name},\n\n'
                f'You have an interview scheduled for {app.drive.job_title} at {app.drive.company.name} '
                f'on {app.interview_date.strftime("%Y-%m-%d %H:%M")}.\n\n'
                f'Please ensure you are prepared.\n\nPlacement Portal'
            )
            try:
                send_email(student.user.email, subject, body)
                sent += 1
            except Exception as e:
                print(f'Failed to send interview reminder to {student.user.email}: {e}')

    return f'Interview reminders sent: {sent}'


def is_eligible(student, drive):
    if drive.eligibility_cgpa and (student.cgpa is None or student.cgpa < drive.eligibility_cgpa):
        return False, []
    if drive.eligibility_branch:
        allowed = [b.strip().lower() for b in drive.eligibility_branch.split(',') if b.strip()]
        student_b = (student.branch or '').strip().lower()
        if not student_b or student_b not in allowed:
            return False, []
    if drive.eligibility_year and (student.year is None or student.year != drive.eligibility_year):
        return False, []
    return True, []
