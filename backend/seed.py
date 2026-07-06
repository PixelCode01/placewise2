from datetime import date, timedelta
from werkzeug.security import generate_password_hash
from extensions import db
from models import User, Company, Student, PlacementDrive, Application, Placement


def init_db(app):
    with app.app_context():
        db.create_all()

        if not User.query.filter_by(role='admin').first():
            admin = User(
                email='admin@ppa.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)

        if not User.query.filter_by(email='student@ppa.com').first():
            student_user = User(
                email='student@ppa.com',
                password_hash=generate_password_hash('student123'),
                role='student'
            )
            db.session.add(student_user)
            db.session.flush()

            student = Student(
                user_id=student_user.id,
                full_name='Alex Johnson',
                branch='Computer Science',
                cgpa=8.85,
                year=4,
                phone='+91 9876543210',
                skills='Python, JavaScript, SQL, Flask, Vue.js, Git',
                linkedin='https://linkedin.com/in/alexjohnson'
            )
            db.session.add(student)

        if not User.query.filter_by(email='recruiter@google.com').first():
            company_user = User(
                email='recruiter@google.com',
                password_hash=generate_password_hash('company123'),
                role='company'
            )
            db.session.add(company_user)
            db.session.flush()

            company = Company(
                user_id=company_user.id,
                name='Google Cloud',
                industry='Cloud Computing & AI',
                location='Bangalore, India',
                website='https://cloud.google.com',
                hr_contact='Sarah Connor',
                hr_email='recruiter@google.com',
                description='Leading enterprise cloud solutions and AI services.',
                approval_status='approved'
            )
            db.session.add(company)
            db.session.flush()

            drive = PlacementDrive(
                company_id=company.id,
                job_title='Software Engineer - Backend',
                job_description='Building scalable cloud services, distributed systems, and backend REST APIs with Python and Go.',
                eligibility_branch='Computer Science, IT, ECE',
                eligibility_cgpa=7.5,
                eligibility_year=4,
                salary='18 LPA',
                application_deadline=date.today() + timedelta(days=30),
                status='approved'
            )
            db.session.add(drive)

        db.session.commit()


if __name__ == '__main__':
    from app import create_app
    app = create_app()
    init_db(app)
    print('Database initialized and seeded successfully.')

