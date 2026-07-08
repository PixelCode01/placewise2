from flask import Blueprint, jsonify, request, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import User, Company, Student

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'auth route working'}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'email and password required'}), 400

    email = data.get('email')
    current_app.logger.info(f"Login attempt for email: {email}")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, data['password']):
        current_app.logger.warning(f"Failed login attempt for {email} - Invalid credentials")
        return jsonify({'error': 'invalid credentials'}), 401

    if not user.is_active:
        current_app.logger.warning(f"Failed login attempt for {email} - Account deactivated")
        return jsonify({'error': 'account is deactivated'}), 403

    current_app.logger.info(f"User {email} logged in successfully")

    claims = {'role': user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'role': user.role,
        'user_id': user.id
    }), 200


@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()
    required = ['email', 'password', 'full_name']
    if not data or not all(data.get(f) for f in required):
        return jsonify({'error': 'email, password and full_name required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'email already registered'}), 400

    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role='student'
    )
    db.session.add(user)
    db.session.flush()

    student = Student(
        user_id=user.id,
        full_name=data['full_name'],
        branch=data.get('branch'),
        cgpa=data.get('cgpa'),
        year=data.get('year')
    )
    db.session.add(student)
    db.session.commit()

    return jsonify({'message': 'registration successful', 'user_id': user.id}), 201


@auth_bp.route('/register/company', methods=['POST'])
def register_company():
    data = request.get_json()
    required = ['email', 'password', 'name']
    if not data or not all(data.get(f) for f in required):
        return jsonify({'error': 'email, password and company name required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'email already registered'}), 400

    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role='company'
    )
    db.session.add(user)
    db.session.flush()

    company = Company(
        user_id=user.id,
        name=data['name'],
        industry=data.get('industry'),
        location=data.get('location'),
        website=data.get('website'),
        hr_contact=data.get('hr_contact'),
        hr_email=data.get('hr_email')
    )
    db.session.add(company)
    db.session.commit()

    return jsonify({'message': 'registration submitted, pending admin approval'}), 201


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = {'role': get_jwt().get('role')}
    new_token = create_access_token(identity=identity, additional_claims=claims)
    return jsonify({'access_token': new_token}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'error': 'user not found'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/public/stats', methods=['GET'])
def public_stats():
    from models import Student, Company, PlacementDrive, Application, Placement
    from sqlalchemy import func
    from datetime import date

    total_students = Student.query.count()
    total_companies = Company.query.filter_by(approval_status='approved').count()
    total_placed = Placement.query.count()
    active_drives = PlacementDrive.query.filter(
        PlacementDrive.status == 'approved',
        PlacementDrive.application_deadline >= date.today()
    ).count()

    return jsonify({
        'total_students': total_students,
        'total_companies': total_companies,
        'total_placed': total_placed,
        'active_drives': active_drives
    }), 200
