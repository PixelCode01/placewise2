import csv
import os
from extensions import celery, db
from models import Student, Application, PlacementDrive
from flask import current_app


@celery.task(name='tasks.exports.export_student_csv', bind=True)
def export_student_csv(self, student_id):
    student = db.session.get(Student, student_id)
    if not student:
        return {'status': 'error', 'message': 'student not found'}

    apps = Application.query.filter_by(student_id=student.id).order_by(Application.applied_at.desc()).all()

    export_dir = os.path.join(current_app.root_path, '..', 'frontend', 'exports')
    os.makedirs(export_dir, exist_ok=True)
    task_id = (getattr(self.request, 'id', None) or 'export')[:8]
    filename = f'applications_{student_id}_{task_id}.csv'
    filepath = os.path.join(export_dir, filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Application ID', 'Company', 'Job Title', 'Applied On', 'Status', 'Interview Date', 'Feedback'])
        for a in apps:
            applied_str = a.applied_at.strftime('%Y-%m-%d') if a.applied_at else ''
            interview_str = a.interview_date.strftime('%Y-%m-%d %H:%M') if a.interview_date else ''
            writer.writerow([
                a.id,
                a.drive.company.name if a.drive and a.drive.company else 'N/A',
                a.drive.job_title if a.drive else 'N/A',
                applied_str,
                a.status,
                interview_str,
                a.company_feedback or ''
            ])

    return {'status': 'done', 'file': f'/exports/{filename}'}


@celery.task(name='tasks.exports.export_company_drive_csv', bind=True)
def export_company_drive_csv(self, company_id, drive_id):
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company_id).first()
    if not drive:
        return {'status': 'error', 'message': 'drive not found'}

    apps = Application.query.filter_by(drive_id=drive.id).order_by(Application.applied_at.desc()).all()

    export_dir = os.path.join(current_app.root_path, '..', 'frontend', 'exports')
    os.makedirs(export_dir, exist_ok=True)
    task_id = (getattr(self.request, 'id', None) or 'export')[:8]
    filename = f'drive_{drive_id}_applicants_{task_id}.csv'
    filepath = os.path.join(export_dir, filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Application ID', 'Student Name', 'Email', 'Branch', 'CGPA', 'Graduation Year', 'Phone', 'Skills', 'Status', 'Applied On', 'Interview Date', 'Recruiter Notes'])
        for a in apps:
            student = a.student
            applied_str = a.applied_at.strftime('%Y-%m-%d') if a.applied_at else ''
            interview_str = a.interview_date.strftime('%Y-%m-%d %H:%M') if a.interview_date else ''
            writer.writerow([
                a.id,
                student.full_name if student else 'N/A',
                student.user.email if student and student.user else 'N/A',
                student.branch if student and student.branch else 'N/A',
                student.cgpa if student and student.cgpa is not None else 'N/A',
                f"Year {student.year}" if student and student.year else 'N/A',
                student.phone if student and student.phone else 'N/A',
                student.skills if student and student.skills else 'N/A',
                a.status,
                applied_str,
                interview_str,
                a.company_feedback or ''
            ])

    return {'status': 'done', 'file': f'/exports/{filename}'}

