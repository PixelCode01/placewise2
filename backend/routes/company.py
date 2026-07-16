from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity
from decorators import role_required
from extensions import db, celery
from models import User, Company, PlacementDrive, Application, Student
from datetime import datetime, date

company_bp = Blueprint('company', __name__)


def get_current_company():
    user_id = int(get_jwt_identity())
    company = Company.query.filter_by(user_id=user_id).first()
    if not company:
        return None, (jsonify({'error': 'company profile not found'}), 404)
    if company.approval_status != 'approved':
        return None, (jsonify({'error': 'account pending admin approval'}), 403)
    if not company.user.is_active:
        return None, (jsonify({'error': 'account is deactivated'}), 403)
    return company, None


@company_bp.route('/profile', methods=['GET'])
@role_required('company')
def get_profile():
    company, err = get_current_company()
    if err:
        return err
    return jsonify(company.to_dict()), 200


@company_bp.route('/profile', methods=['PUT'])
@role_required('company')
def update_profile():
    company, err = get_current_company()
    if err:
        return err
    data = request.get_json()
    fields = ['name', 'industry', 'location', 'website', 'hr_contact', 'hr_email', 'description']
    for field in fields:
        if field in data:
            setattr(company, field, data[field])
    db.session.commit()
    return jsonify(company.to_dict()), 200


@company_bp.route('/drives', methods=['GET'])
@role_required('company')
def get_drives():
    company, err = get_current_company()
    if err:
        return err
    drives = company.drives.order_by(PlacementDrive.created_at.desc()).all()
    return jsonify([d.to_dict() for d in drives]), 200


@company_bp.route('/drives', methods=['POST'])
@role_required('company')
def create_drive():
    company, err = get_current_company()
    if err:
        return err

    data = request.get_json()
    if not data or not data.get('job_title') or not data.get('application_deadline'):
        return jsonify({'error': 'job_title and application_deadline are required'}), 400

    try:
        deadline = date.fromisoformat(data['application_deadline'])
    except ValueError:
        return jsonify({'error': 'invalid date format, use YYYY-MM-DD'}), 400

    if deadline < date.today():
        return jsonify({'error': 'deadline cannot be in the past'}), 400

    drive = PlacementDrive(
        company_id=company.id,
        job_title=data['job_title'],
        job_description=data.get('job_description'),
        eligibility_branch=data.get('eligibility_branch'),
        eligibility_cgpa=data.get('eligibility_cgpa'),
        eligibility_year=data.get('eligibility_year'),
        salary=data.get('salary'),
        application_deadline=deadline
    )
    db.session.add(drive)
    db.session.commit()
    return jsonify({'message': 'drive created, pending admin approval', 'id': drive.id, 'drive_id': drive.id, 'drive': drive.to_dict()}), 201


@company_bp.route('/drives/<int:drive_id>/close', methods=['PATCH'])
@role_required('company')
def close_drive(drive_id):
    company, err = get_current_company()
    if err:
        return err

    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first()
    if not drive:
        return jsonify({'error': 'drive not found'}), 404
    if drive.status == 'closed':
        return jsonify({'error': 'drive is already closed'}), 400

    drive.status = 'closed'
    db.session.commit()
    from cache import cache_delete
    cache_delete('approved_drives')
    return jsonify({'message': 'drive closed'}), 200


@company_bp.route('/drives/<int:drive_id>/applications', methods=['GET'])
@role_required('company')
def drive_applications(drive_id):
    company, err = get_current_company()
    if err:
        return err

    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first()
    if not drive:
        return jsonify({'error': 'drive not found'}), 404

    status_filter = request.args.get('status', '').strip()
    query = drive.applications
    if status_filter:
        query = query.filter_by(status=status_filter)

    apps = query.order_by(Application.applied_at.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200


ALLOWED_TRANSITIONS = {
    'applied':     ['shortlisted', 'rejected'],
    'shortlisted': ['interview', 'rejected'],
    'interview':   ['offer', 'rejected'],
    'offer':       ['placed', 'rejected'],
    'placed':      [],
    'rejected':    []
}

from models import Placement
from celery.result import AsyncResult
from tasks.exports import export_company_drive_csv

@company_bp.route('/applications/<int:app_id>/status', methods=['PATCH', 'PUT', 'POST'])
@role_required('company')
def update_application_status(app_id):
    company, err = get_current_company()
    if err:
        return err

    application = db.session.get(Application, app_id)
    if not application:
        return jsonify({'error': 'application not found'}), 404

    if application.drive.company_id != company.id:
        return jsonify({'error': 'not your application'}), 403

    data = request.get_json() or {}
    new_status = data.get('status')
    allowed = ALLOWED_TRANSITIONS.get(application.status, [])

    if new_status and new_status != application.status:
        if new_status not in allowed:
            return jsonify({
                'error': f'cannot move from {application.status} to {new_status}',
                'allowed': allowed
            }), 400
        application.status = new_status

    if 'feedback' in data or 'company_feedback' in data:
        application.company_feedback = data.get('feedback') or data.get('company_feedback') or application.company_feedback

    if application.status == 'interview':
        raw = data.get('interview_date')
        if raw:
            try:
                application.interview_date = datetime.fromisoformat(raw)
            except ValueError:
                return jsonify({'error': 'invalid interview_date format, use ISO 8601'}), 400

    if application.status == 'placed':
        existing = Placement.query.filter_by(application_id=application.id).first()
        if not existing:
            p = Placement(
                application_id=application.id,
                student_id=application.student_id,
                company_id=company.id,
                job_title=application.drive.job_title,
                salary=data.get('salary') or application.drive.salary,
                joining_date=datetime.fromisoformat(data['joining_date']).date() if data.get('joining_date') else None,
                offer_letter_path=data.get('offer_letter_path')
            )
            db.session.add(p)

    db.session.commit()
    return jsonify({'message': 'status updated successfully', 'application': application.to_dict()}), 200

@company_bp.route('/applications/<int:app_id>/student', methods=['GET'])
@role_required('company')
def view_applicant_profile(app_id):
    company, err = get_current_company()
    if err:
        return err
    application = db.session.get(Application, app_id)
    if not application or application.drive.company_id != company.id:
        return jsonify({'error': 'not found'}), 404
    return jsonify(application.student.to_dict()), 200


@company_bp.route('/drives/<int:drive_id>/export', methods=['POST'])
@role_required('company')
def trigger_drive_export(drive_id):
    company, err = get_current_company()
    if err:
        return err
    try:
        task = export_company_drive_csv.delay(company.id, drive_id)
        return jsonify({'task_id': task.id, 'message': 'export started'}), 202
    except Exception as e:
        current_app.logger.warning(f"Failed to queue export task: {e}")
        return jsonify({'error': 'Background task queue is unavailable. Ensure Redis is running.'}), 503


@company_bp.route('/tasks/<task_id>', methods=['GET'])
@role_required('company')
def task_status(task_id):
    try:
        result = celery.AsyncResult(task_id)
        if result.state == 'PENDING':
            return jsonify({'state': 'pending'}), 200
        if result.state == 'SUCCESS':
            return jsonify({'state': 'done', 'result': result.result}), 200
        if result.state == 'FAILURE':
            return jsonify({'state': 'failed'}), 200
        return jsonify({'state': result.state}), 200
    except Exception as e:
        current_app.logger.warning(f"Error reading task status {task_id}: {e}")
        return jsonify({'state': 'pending'}), 200


from ats import run_ats_check

@company_bp.route('/drives/<int:drive_id>/ats-rank', methods=['GET'])
@role_required('company')
def ats_rank(drive_id):
    company, err = get_current_company()
    if err:
        return err

    drive = db.session.get(PlacementDrive, drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'error': 'not found'}), 404

    applications = drive.applications.all()
    results = []
    for app in applications:
        score_data = run_ats_check(app.student, drive)
        results.append({
            'application_id': app.id,
            'student_name': app.student.full_name,
            'student_id': app.student.id,
            'match_score': score_data['score'],
            'matched_keywords': score_data['matched_skills'],
            **score_data
        })

    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(results), 200


