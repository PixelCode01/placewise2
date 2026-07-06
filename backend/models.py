from datetime import datetime, timezone, date
from extensions import db


def utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.Text, nullable=False)  # 'admin' | 'company' | 'student'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    company = db.relationship('Company', back_populates='user', uselist=False)
    student = db.relationship('Student', back_populates='user', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }


class Company(db.Model):
    __tablename__ = 'company'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    name = db.Column(db.Text, nullable=False)
    industry = db.Column(db.Text)
    location = db.Column(db.Text)
    website = db.Column(db.Text)
    hr_contact = db.Column(db.Text)
    hr_email = db.Column(db.Text)
    description = db.Column(db.Text)
    approval_status = db.Column(db.Text, default='pending')  # 'pending' | 'approved' | 'rejected'
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship('User', back_populates='company')
    drives = db.relationship('PlacementDrive', back_populates='company', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'industry': self.industry,
            'location': self.location,
            'website': self.website,
            'hr_contact': self.hr_contact,
            'hr_email': self.hr_email,
            'description': self.description,
            'approval_status': self.approval_status,
            'is_active': self.user.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }


class Student(db.Model):
    __tablename__ = 'student'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    full_name = db.Column(db.Text, nullable=False)
    branch = db.Column(db.Text)
    cgpa = db.Column(db.Float)
    year = db.Column(db.Integer)
    phone = db.Column(db.Text)
    resume_path = db.Column(db.Text)
    skills = db.Column(db.Text)  # comma-separated: "Python,SQL,React"
    linkedin = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship('User', back_populates='student')
    applications = db.relationship('Application', back_populates='student', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'email': self.user.email,
            'branch': self.branch,
            'cgpa': self.cgpa,
            'year': self.year,
            'phone': self.phone,
            'resume_path': self.resume_path,
            'skills': self.skills,
            'linkedin': self.linkedin,
            'is_active': self.user.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }


class PlacementDrive(db.Model):
    __tablename__ = 'placement_drive'

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    job_title = db.Column(db.Text, nullable=False)
    job_description = db.Column(db.Text)
    eligibility_branch = db.Column(db.Text)
    eligibility_cgpa = db.Column(db.Float)
    eligibility_year = db.Column(db.Integer)
    salary = db.Column(db.Text)
    application_deadline = db.Column(db.Date, nullable=False)
    status = db.Column(db.Text, default='pending')  # 'pending' | 'approved' | 'closed'
    created_at = db.Column(db.DateTime, default=utc_now)

    company = db.relationship('Company', back_populates='drives')
    applications = db.relationship('Application', back_populates='drive', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'company_name': self.company.name,
            'job_title': self.job_title,
            'job_description': self.job_description,
            'eligibility_branch': self.eligibility_branch,
            'eligibility_cgpa': self.eligibility_cgpa,
            'eligibility_year': self.eligibility_year,
            'salary': self.salary,
            'application_deadline': self.application_deadline.isoformat(),
            'status': self.status,
            'applicant_count': self.applications.count(),
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }


class Application(db.Model):
    __tablename__ = 'application'
    __table_args__ = (
        db.UniqueConstraint('student_id', 'drive_id', name='uq_student_drive'),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    drive_id = db.Column(db.Integer, db.ForeignKey('placement_drive.id'), nullable=False)
    applied_at = db.Column(db.DateTime, default=utc_now)
    status = db.Column(db.Text, default='applied')  # applied → shortlisted → interview → offer → placed | rejected
    company_feedback = db.Column(db.Text)
    interview_date = db.Column(db.DateTime)

    student = db.relationship('Student', back_populates='applications')
    drive = db.relationship('PlacementDrive', back_populates='applications')
    placement = db.relationship('Placement', back_populates='application', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else '',
            'student_email': self.student.user.email if self.student and self.student.user else '',
            'student_branch': self.student.branch if self.student else '',
            'student_cgpa': self.student.cgpa if self.student else None,
            'student_year': self.student.year if self.student else None,
            'student_skills': self.student.skills if self.student else '',
            'student_phone': self.student.phone if self.student else '',
            'student_linkedin': self.student.linkedin if self.student else '',
            'resume_path': self.student.resume_path if self.student else '',
            'drive_id': self.drive_id,
            'job_title': self.drive.job_title if self.drive else '',
            'company_name': self.drive.company.name if self.drive and self.drive.company else '',
            'applied_at': self.applied_at.isoformat() if self.applied_at else '',
            'status': self.status,
            'company_feedback': self.company_feedback,
            'interview_date': self.interview_date.isoformat() if self.interview_date else None,
            'placement': self.placement.to_dict() if self.placement else None
        }


class Placement(db.Model):
    __tablename__ = 'placement'

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('application.id'), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    job_title = db.Column(db.Text, nullable=False)
    salary = db.Column(db.Text)
    joining_date = db.Column(db.Date)
    offer_letter_path = db.Column(db.Text)
    confirmed_at = db.Column(db.DateTime, default=utc_now)

    application = db.relationship('Application', back_populates='placement')

    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'student_id': self.student_id,
            'student_name': self.application.student.full_name,
            'company_id': self.company_id,
            'company_name': self.application.drive.company.name,
            'job_title': self.job_title,
            'salary': self.salary,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'offer_letter_path': self.offer_letter_path,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else ''
        }
