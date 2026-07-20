from flask import Blueprint, jsonify, request, send_from_directory, current_app
from flask_jwt_extended import get_jwt_identity
from decorators import role_required
from extensions import db, celery
from models import User, Student, PlacementDrive, Application
from datetime import date
import os
from werkzeug.utils import secure_filename

student_bp = Blueprint('student', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_student():
    user_id = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        return None, (jsonify({'error': 'student profile not found'}), 404)
    if not student.user.is_active:
        return None, (jsonify({'error': 'account is deactivated'}), 403)
    return student, None


@student_bp.route('/profile', methods=['GET'])
@role_required('student')
def get_profile():
    student, err = get_current_student()
    if err:
        return err
    return jsonify(student.to_dict()), 200


@student_bp.route('/profile', methods=['PUT'])
@role_required('student')
def update_profile():
    student, err = get_current_student()
    if err:
        return err
    data = request.get_json()
    fields = ['full_name', 'branch', 'cgpa', 'year', 'phone', 'skills', 'linkedin']
    for field in fields:
        if field in data:
            setattr(student, field, data[field])
    db.session.commit()
    return jsonify(student.to_dict()), 200


@student_bp.route('/profile/resume', methods=['POST'])
@role_required('student')
def upload_resume():
    student, err = get_current_student()
    if err:
        return err
    if 'resume' not in request.files:
        return jsonify({'error': 'no file uploaded'}), 400
    f = request.files['resume']
    if not f.filename or not allowed_file(f.filename):
        return jsonify({'error': 'only PDF, DOC, DOCX files allowed'}), 400
    filename = secure_filename(f'resume_{student.id}_{f.filename}')
    upload_dir = os.path.join(current_app.root_path, '..', 'frontend', 'resumes')
    os.makedirs(upload_dir, exist_ok=True)
    f.save(os.path.join(upload_dir, filename))
    student.resume_path = f'/api/student/serve-resume/{filename}'
    db.session.commit()
    return jsonify({'message': 'resume uploaded', 'resume_path': student.resume_path}), 200


from flask import send_from_directory

@student_bp.route('/serve-resume/<path:filename>', methods=['GET'])
def serve_resume(filename):
    upload_dir = os.path.join(current_app.root_path, '..', 'frontend', 'resumes')
    return send_from_directory(os.path.abspath(upload_dir), filename)


from cache import cache_get, cache_set

@student_bp.route('/drives', methods=['GET'])
@role_required('student')
def browse_drives():
    student, err = get_current_student()
    if err:
        return err

    search = request.args.get('search', '').strip()
    eligible_only = request.args.get('eligible', 'false').lower() == 'true'

    cache_key = 'approved_drives'
    drives_raw = cache_get(cache_key)

    if drives_raw is None:
        drives = PlacementDrive.query.filter_by(status='approved').filter(
            PlacementDrive.application_deadline >= date.today()
        ).order_by(PlacementDrive.application_deadline.asc()).all()
        drives_raw = [d.to_dict() for d in drives]
        cache_set(cache_key, drives_raw, ttl=300)

    applied_ids = {a.drive_id for a in student.applications.all()}

    if search:
        term = search.lower()
        drives_raw = [d for d in drives_raw if term in d['job_title'].lower()
                      or (d.get('job_description') or '').lower().find(term) != -1]

    result = []
    for d in drives_raw:
        d = dict(d)
        d['already_applied'] = d['id'] in applied_ids
        eligible, reasons = check_eligibility_from_dict(student, d)
        d['eligible'] = eligible
        d['ineligible_reasons'] = reasons
        if eligible_only and not eligible:
            continue
        result.append(d)

    return jsonify(result), 200

def check_eligibility(student, drive):
    reasons = []
    if drive.eligibility_cgpa and (not student.cgpa or student.cgpa < drive.eligibility_cgpa):
        reasons.append(f'Min CGPA {drive.eligibility_cgpa} required (yours: {student.cgpa or "not set"})')
    if drive.eligibility_branch:
        if not student.branch:
            reasons.append(f'Branch not set on your profile (required: {drive.eligibility_branch})')
        else:
            allowed = [b.strip() for b in drive.eligibility_branch.split(',')]
            if student.branch not in allowed:
                reasons.append(f'Branch must be one of: {drive.eligibility_branch}')
    if drive.eligibility_year and student.year and student.year != drive.eligibility_year:
        reasons.append(f'Year {drive.eligibility_year} required (yours: {student.year})')
    return len(reasons) == 0, reasons

def check_eligibility_from_dict(student, d):
    reasons = []
    if d.get('eligibility_cgpa') and (not student.cgpa or student.cgpa < d['eligibility_cgpa']):
        reasons.append(f'Min CGPA {d["eligibility_cgpa"]} required (yours: {student.cgpa or "not set"})')
    if d.get('eligibility_branch'):
        if not student.branch:
            reasons.append(f'Branch not set on your profile (required: {d["eligibility_branch"]})')
        else:
            allowed = [b.strip() for b in d['eligibility_branch'].split(',')]
            if student.branch not in allowed:
                reasons.append(f'Branch must be one of: {d["eligibility_branch"]}')
    if d.get('eligibility_year') and student.year and student.year != d['eligibility_year']:
        reasons.append(f'Year {d["eligibility_year"]} required (yours: {student.year})')
    return len(reasons) == 0, reasons


@student_bp.route('/drives/<int:drive_id>/apply', methods=['POST'])
@student_bp.route('/apply', methods=['POST'])
@role_required('student')
def apply(drive_id=None):
    student, err = get_current_student()
    if err:
        return err

    if drive_id is None:
        data = request.get_json() or {}
        drive_id = data.get('drive_id')
        if not drive_id:
            return jsonify({'error': 'drive_id is required'}), 400

    drive = db.session.get(PlacementDrive, drive_id)
    if not drive:
        return jsonify({'error': 'drive not found'}), 404
    if drive.status != 'approved':
        return jsonify({'error': 'this drive is not open for applications'}), 400
    if drive.application_deadline < date.today():
        return jsonify({'error': 'application deadline has passed'}), 400

    eligible, reasons = check_eligibility(student, drive)
    if not eligible:
        return jsonify({'error': 'eligibility criteria not met', 'reasons': reasons}), 400

    existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
    if existing:
        return jsonify({'error': 'you have already applied to this drive'}), 400

    app = Application(student_id=student.id, drive_id=drive_id)
    db.session.add(app)
    db.session.commit()
    return jsonify({'message': 'application submitted', 'application_id': app.id}), 201


@student_bp.route('/applications', methods=['GET'])
@role_required('student')
def my_applications():
    student, err = get_current_student()
    if err:
        return err
    apps = student.applications.order_by(Application.applied_at.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200

from celery.result import AsyncResult
from tasks.exports import export_student_csv

@student_bp.route('/applications/export', methods=['POST'])
@role_required('student')
def trigger_export():
    student, err = get_current_student()
    if err:
        return err
    try:
        task = export_student_csv.delay(student.id)
        return jsonify({'task_id': task.id, 'message': 'export started'}), 202
    except Exception as e:
        current_app.logger.warning(f"Failed to queue student export task: {e}")
        return jsonify({'error': 'Background task queue is unavailable. Ensure Redis is running.'}), 503


@student_bp.route('/tasks/<task_id>', methods=['GET'])
@role_required('student')
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

@student_bp.route('/drives/<int:drive_id>/ats-check', methods=['GET'])
@role_required('student')
def ats_check(drive_id):
    student, err = get_current_student()
    if err:
        return err

    drive = db.session.get(PlacementDrive, drive_id)
    if not drive or drive.status != 'approved':
        return jsonify({'error': 'drive not found'}), 404

    result = run_ats_check(student, drive)
    result['match_score'] = result['score']
    result['matched_keywords'] = result['matched_skills']
    return jsonify(result), 200
