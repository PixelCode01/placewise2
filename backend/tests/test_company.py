from datetime import date, timedelta
from werkzeug.security import generate_password_hash
from extensions import db
from models import User, Company, Student, PlacementDrive, Application, Placement

def setup_company(app, approved=True):
    with app.app_context():
        u = User(email="tech@corp.com", password_hash=generate_password_hash("pass123"), role="company")
        db.session.add(u)
        db.session.flush()
        c = Company(user_id=u.id, name="TechCorp", approval_status="approved" if approved else "pending")
        db.session.add(c)
        db.session.commit()
        return u.id, c.id

def test_company_create_drive_and_status_flow(client, app):
    u_id, c_id = setup_company(app, approved=True)
    
    login_res = client.post('/api/auth/login', json={"email": "tech@corp.com", "password": "pass123"})
    token = login_res.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 1. Create drive
    drive_data = {
        "job_title": "Software Engineer",
        "job_description": "Looking for Python, SQL, and Flask developer",
        "salary": "12 LPA",
        "application_deadline": (date.today() + timedelta(days=10)).isoformat(),
        "eligibility_branch": "CSE,ECE",
        "eligibility_cgpa": 7.5,
        "eligibility_year": 4
    }
    create_res = client.post('/api/company/drives', json=drive_data, headers=headers)
    assert create_res.status_code == 201
    drive_id = create_res.json['id']

    # 2. Add applicant
    with app.app_context():
        su = User(email="student@ppa.com", password_hash=generate_password_hash("pass"), role="student")
        db.session.add(su)
        db.session.flush()
        s = Student(user_id=su.id, full_name="Bob Test", branch="CSE", cgpa=8.0, year=4, skills="Python, SQL, Flask")
        db.session.add(s)
        db.session.flush()
        app_rec = Application(student_id=s.id, drive_id=drive_id, status="applied")
        db.session.add(app_rec)
        db.session.commit()
        app_id = app_rec.id

    # 3. View applications
    apps_res = client.get(f'/api/company/drives/{drive_id}/applications', headers=headers)
    assert apps_res.status_code == 200
    assert len(apps_res.json) == 1

    # 4. ATS rank applicants while in applied state
    ats_res = client.get(f'/api/company/drives/{drive_id}/ats-rank', headers=headers)
    assert ats_res.status_code == 200
    assert len(ats_res.json) == 1
    assert ats_res.json[0]['score'] > 0

    # 5. Status progression: applied -> shortlisted -> interview -> offer -> placed
    s1 = client.patch(f'/api/company/applications/{app_id}/status', json={"status": "shortlisted"}, headers=headers)
    assert s1.status_code == 200

    s2 = client.patch(f'/api/company/applications/{app_id}/status', json={"status": "interview", "interview_date": "2026-08-10T10:00:00"}, headers=headers)
    assert s2.status_code == 200

    s3 = client.patch(f'/api/company/applications/{app_id}/status', json={"status": "offer"}, headers=headers)
    assert s3.status_code == 200

    s4 = client.patch(f'/api/company/applications/{app_id}/status', json={"status": "placed"}, headers=headers)
    assert s4.status_code == 200

    with app.app_context():
        placement = Placement.query.filter_by(student_id=1).first()
        assert placement is not None
        assert placement.salary == "12 LPA"
