from datetime import date, timedelta
from werkzeug.security import generate_password_hash
from extensions import db
from models import User, Company, Student, PlacementDrive, Application

def setup_student_and_drive(app, cgpa=8.0, branch="CSE", year=4):
    with app.app_context():
        # Company and Drive
        cu = User(email="comp@hire.com", password_hash=generate_password_hash("pass"), role="company")
        db.session.add(cu)
        db.session.flush()
        c = Company(user_id=cu.id, name="HireCo", approval_status="approved")
        db.session.add(c)
        db.session.flush()
        
        d = PlacementDrive(
            company_id=c.id,
            job_title="Backend Developer",
            job_description="Python Flask and SQL required",
            salary="10 LPA",
            application_deadline=date.today() + timedelta(days=5),
            eligibility_branch="CSE,ECE",
            eligibility_cgpa=7.0,
            eligibility_year=4,
            status="approved"
        )
        db.session.add(d)
        
        # Student
        su = User(email="stud@hire.com", password_hash=generate_password_hash("pass123"), role="student")
        db.session.add(su)
        db.session.flush()
        s = Student(user_id=su.id, full_name="Charlie Brown", branch=branch, cgpa=cgpa, year=year, skills="Python, Flask, SQL")
        db.session.add(s)
        db.session.commit()
        return su.id, s.id, d.id

def test_student_flow(client, app):
    su_id, s_id, d_id = setup_student_and_drive(app)

    login_res = client.post('/api/auth/login', json={"email": "stud@hire.com", "password": "pass123"})
    token = login_res.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 1. Get profile
    p_res = client.get('/api/student/profile', headers=headers)
    assert p_res.status_code == 200
    assert p_res.json['full_name'] == "Charlie Brown"

    # 2. Update profile
    up_res = client.put('/api/student/profile', json={"skills": "Python, SQL, Flask, Redis", "phone": "1234567890"}, headers=headers)
    assert up_res.status_code == 200

    # 3. Browse drives
    drives_res = client.get('/api/student/drives', headers=headers)
    assert drives_res.status_code == 200
    assert len(drives_res.json) == 1
    assert drives_res.json[0]['eligible'] is True

    # 4. ATS check
    ats_res = client.get(f'/api/student/drives/{d_id}/ats-check', headers=headers)
    assert ats_res.status_code == 200
    assert ats_res.json['score'] > 0

    # 5. Apply to drive
    app_res = client.post(f'/api/student/drives/{d_id}/apply', headers=headers)
    assert app_res.status_code == 201

    # 6. Duplicate apply should fail
    dup_res = client.post(f'/api/student/drives/{d_id}/apply', headers=headers)
    assert dup_res.status_code == 400

    # 7. View applications
    my_apps = client.get('/api/student/applications', headers=headers)
    assert my_apps.status_code == 200
    assert len(my_apps.json) == 1
    assert my_apps.json[0]['job_title'] == "Backend Developer"

def test_all_branches_eligibility(client, app):
    with app.app_context():
        cu = User(email="allco@hire.com", password_hash=generate_password_hash("pass"), role="company")
        db.session.add(cu)
        db.session.flush()
        c = Company(user_id=cu.id, name="AllBranchCo", approval_status="approved")
        db.session.add(c)
        db.session.flush()
        
        d = PlacementDrive(
            company_id=c.id,
            job_title="General Trainee",
            job_description="Open to all branches",
            salary="6 LPA",
            application_deadline=date.today() + timedelta(days=5),
            eligibility_branch="All Branches",
            eligibility_cgpa=6.0,
            eligibility_year=4,
            status="approved"
        )
        db.session.add(d)

        su = User(email="mech@hire.com", password_hash=generate_password_hash("pass123"), role="student")
        db.session.add(su)
        db.session.flush()
        s = Student(user_id=su.id, full_name="Mechanical Student", branch="Mechanical Engineering", cgpa=7.5, year=4)
        db.session.add(s)
        db.session.commit()

        d_id = d.id

    login_res = client.post('/api/auth/login', json={"email": "mech@hire.com", "password": "pass123"})
    token = login_res.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    drives_res = client.get('/api/student/drives', headers=headers)
    assert drives_res.status_code == 200
    all_drive = next(x for x in drives_res.json if x['id'] == d_id)
    assert all_drive['eligible'] is True

    app_res = client.post(f'/api/student/drives/{d_id}/apply', headers=headers)
    assert app_res.status_code == 201

