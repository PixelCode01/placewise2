from flask import Blueprint, jsonify, request
from decorators import role_required
from flask_jwt_extended import get_jwt_identity, get_jwt
from extensions import db
from models import User, Company, Student, PlacementDrive, Application
from cache import cache_get, cache_set, cache_delete

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard')
@role_required('admin')
def dashboard():
    cache_key = 'admin_stats'
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached), 200

    from models import Placement
    stats = {
        'total_students': Student.query.count(),
        'total_companies': Company.query.count(),
        'total_drives': PlacementDrive.query.count(),
        'total_applications': Application.query.count(),
        'total_placed': Placement.query.count(),
        'pending_companies': Company.query.filter_by(approval_status='pending').count(),
        'pending_drives': PlacementDrive.query.filter_by(status='pending').count(),
    }
    cache_set(cache_key, stats, ttl=120)
    return jsonify(stats), 200

@admin_bp.route('/companies')
@role_required('admin')
def companies():
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()
    query = Company.query
    if search:
        query = query.filter(db.or_(
            Company.name.ilike(f'%{search}%'),
            Company.industry.ilike(f'%{search}%'),
            Company.location.ilike(f'%{search}%'),
            Company.hr_email.ilike(f'%{search}%'),
        ))
    if status:
        query = query.filter_by(approval_status=status)
    companies = query.order_by(Company.created_at.desc()).all()
    return jsonify([c.to_dict() for c in companies]), 200

@admin_bp.route('/companies/<int:company_id>/approve', methods=['PATCH', 'POST', 'PUT'])
@role_required('admin')
def approve_company(company_id):
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify({'error': 'company not found'}), 404
    company.approval_status = 'approved'
    db.session.commit()
    cache_delete('admin_stats')
    return jsonify({'message': 'company approved'}), 200

@admin_bp.route('/companies/<int:company_id>/reject', methods=['PATCH', 'POST', 'PUT'])
@role_required('admin')
def reject_company(company_id):
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify({'error': 'company not found'}), 404
    company.approval_status = 'rejected'
    db.session.commit()
    cache_delete('admin_stats')
    return jsonify({'message': 'company rejected'}), 200

@admin_bp.route('/companies/<int:company_id>/toggle-active', methods=['PATCH', 'POST', 'PUT'])
@admin_bp.route('/companies/<int:company_id>/blacklist', methods=['PATCH', 'POST', 'PUT'])
@admin_bp.route('/companies/<int:company_id>/activate', methods=['PATCH', 'POST', 'PUT'])
@role_required('admin')
def toggle_company_active(company_id):
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify({'error': 'company not found'}), 404
    if request.path.endswith('/blacklist'):
        company.user.is_active = False
    elif request.path.endswith('/activate'):
        company.user.is_active = True
    else:
        company.user.is_active = not company.user.is_active
    db.session.commit()
    cache_delete('admin_stats')
    status = 'activated' if company.user.is_active else 'blacklisted'
    return jsonify({'message': f'company {status}', 'is_active': company.user.is_active}), 200

@admin_bp.route('/students')
@role_required('admin')
def students():
    search = request.args.get('search', '').strip()
    query = Student.query
    if search:
        filters = [
            Student.full_name.ilike(f'%{search}%'),
            Student.user.has(User.email.ilike(f'%{search}%')),
            Student.phone.ilike(f'%{search}%'),
        ]
        try:
            sid = int(search)
            filters.append(Student.id == sid)
        except ValueError:
            pass
        query = query.filter(db.or_(*filters))
    students = query.order_by(Student.created_at.desc()).all()
    return jsonify([s.to_dict() for s in students]), 200

@admin_bp.route('/students/<int:student_id>/toggle-active', methods=['PATCH', 'POST', 'PUT'])
@admin_bp.route('/students/<int:student_id>/blacklist', methods=['PATCH', 'POST', 'PUT'])
@admin_bp.route('/students/<int:student_id>/activate', methods=['PATCH', 'POST', 'PUT'])
@role_required('admin')
def toggle_student_active(student_id):
    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'error': 'student not found'}), 404
    if request.path.endswith('/blacklist'):
        student.user.is_active = False
    elif request.path.endswith('/activate'):
        student.user.is_active = True
    else:
        student.user.is_active = not student.user.is_active
    db.session.commit()
    status = 'activated' if student.user.is_active else 'blacklisted'
    return jsonify({'message': f'student {status}', 'is_active': student.user.is_active}), 200

@admin_bp.route('/drives')
@role_required('admin')
def drives():
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip()
    query = PlacementDrive.query.join(Company, PlacementDrive.company_id == Company.id)
    if search:
        query = query.filter(db.or_(
            PlacementDrive.job_title.ilike(f'%{search}%'),
            PlacementDrive.job_description.ilike(f'%{search}%'),
            PlacementDrive.salary.ilike(f'%{search}%'),
            Company.name.ilike(f'%{search}%'),
        ))
    if status_filter:
        query = query.filter(PlacementDrive.status == status_filter)
    drives = query.order_by(PlacementDrive.created_at.desc()).all()
    return jsonify([d.to_dict() for d in drives]), 200

@admin_bp.route('/drives/<int:drive_id>/approve', methods=['PATCH', 'POST', 'PUT'])
@role_required('admin')
def approve_drive(drive_id):
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive:
        return jsonify({'error': 'drive not found'}), 404
    if drive.status != 'pending':
        return jsonify({'error': 'only pending drives can be approved'}), 400
    drive.status = 'approved'
    db.session.commit()
    cache_delete('approved_drives', 'admin_stats')
    return jsonify({'message': 'drive approved'}), 200

@admin_bp.route('/drives/<int:drive_id>/reject', methods=['PATCH', 'POST', 'PUT'])
@role_required('admin')
def reject_drive(drive_id):
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive:
        return jsonify({'error': 'drive not found'}), 404
    if drive.status != 'pending':
        return jsonify({'error': 'only pending drives can be rejected'}), 400
    drive.status = 'rejected'
    db.session.commit()
    cache_delete('approved_drives', 'admin_stats')
    return jsonify({'message': 'drive rejected'}), 200

@admin_bp.route('/drives/<int:drive_id>/close', methods=['PATCH', 'POST', 'PUT'])
@role_required('admin')
def close_drive(drive_id):
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive:
        return jsonify({'error': 'drive not found'}), 404
    drive.status = 'closed'
    db.session.commit()
    cache_delete('approved_drives', 'admin_stats')
    return jsonify({'message': 'drive closed'}), 200

@admin_bp.route('/applications')
@role_required('admin')
def applications():
    apps = Application.query.order_by(Application.applied_at.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200

from sqlalchemy import func

@admin_bp.route('/stats/charts', methods=['GET'])
@role_required('admin')
def get_chart_data():
    from models import Placement
    hired_students = db.session.query(func.count(Placement.id)).scalar() or 0
    total_students = db.session.query(func.count(Student.id)).scalar() or 0
    unplaced_students = max(0, total_students - hired_students)

    drives_with_counts = db.session.query(
        PlacementDrive.job_title,
        func.count(Application.id)
    ).outerjoin(Application, PlacementDrive.id == Application.drive_id)\
     .group_by(PlacementDrive.id)\
     .limit(5).all()

    drive_labels = [d[0] for d in drives_with_counts]
    drive_counts = [d[1] for d in drives_with_counts]

    return jsonify({
        'student_status': {
            'labels': ['Hired', 'Unplaced'],
            'data': [hired_students, unplaced_students]
        },
        'drive_applications': {
            'labels': drive_labels,
            'data': drive_counts
        }
    }), 200

@admin_bp.route('/students/<int:student_id>', methods=['GET'])
@role_required('admin')
def view_student(student_id):
    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'error': 'not found'}), 404
    apps = student.applications.order_by(Application.applied_at.desc()).all()
    return jsonify({
        'student': student.to_dict(),
        'applications': [a.to_dict() for a in apps]
    }), 200

@admin_bp.route('/placements', methods=['GET'])
@role_required('admin')
def all_placements():
    from models import Placement
    placements = Placement.query.order_by(Placement.confirmed_at.desc()).all()
    return jsonify([p.to_dict() for p in placements]), 200
