import json
from werkzeug.security import generate_password_hash
from extensions import db
from models import User, Company, Student, PlacementDrive

def create_admin(app):
    with app.app_context():
        if not User.query.filter_by(email="admin@ppa.com").first():
            admin_user = User(
                email="admin@ppa.com",
                password_hash=generate_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.session.add(admin_user)
            db.session.commit()

def get_admin_token(client, app):
    create_admin(app)
    res = client.post('/api/auth/login', json={
        "email": "admin@ppa.com",
        "password": "admin123"
    })
    return res.json['access_token']

def test_admin_dashboard_stats(client, app):
    token = get_admin_token(client, app)
    res = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    data = res.json
    assert 'total_students' in data
    assert 'total_companies' in data
    assert 'total_drives' in data
    assert 'total_applications' in data

def test_admin_company_approval_and_toggle(client, app):
    token = get_admin_token(client, app)
    
    with app.app_context():
        u = User(email="comp@test.com", password_hash=generate_password_hash("pass"), role="company")
        db.session.add(u)
        db.session.flush()
        c = Company(user_id=u.id, name="Test Corp", industry="Tech", location="Bangalore")
        db.session.add(c)
        db.session.commit()
        comp_id = c.id

    res = client.get('/api/admin/companies', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert len(res.json) == 1

    res = client.patch(f'/api/admin/companies/{comp_id}/approve', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200

    with app.app_context():
        comp = db.session.get(Company, comp_id)
        assert comp.approval_status == 'approved'

    res = client.patch(f'/api/admin/companies/{comp_id}/toggle-active', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert res.json['is_active'] is False

def test_admin_student_search_and_toggle(client, app):
    token = get_admin_token(client, app)

    with app.app_context():
        u = User(email="stud@test.com", password_hash=generate_password_hash("pass"), role="student")
        db.session.add(u)
        db.session.flush()
        s = Student(user_id=u.id, full_name="Alice Wonderland", branch="CSE", cgpa=8.5, year=4, phone="9876543210")
        db.session.add(s)
        db.session.commit()
        stud_id = s.id

    res = client.get('/api/admin/students?search=Alice', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert len(res.json) == 1
    assert res.json[0]['full_name'] == "Alice Wonderland"

    res = client.patch(f'/api/admin/students/{stud_id}/toggle-active', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert res.json['is_active'] is False
