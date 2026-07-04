import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-in-prod-placement-portal-secret')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(basedir, 'ppa.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-secure-key-32-chars-long-min')
    JWT_ACCESS_TOKEN_EXPIRES = 900
    JWT_REFRESH_TOKEN_EXPIRES = 604800
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
    REDIS_URL = 'redis://localhost:6379/1'

    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME', 'noreply@ppa.com')
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@ppa.com')

    CELERYBEAT_SCHEDULE = {
        'daily-reminders': {
            'task': 'tasks.reminders.send_deadline_reminders',
            'schedule': 86400.0,
        },
        'daily-interview-reminders': {
            'task': 'tasks.reminders.send_interview_reminders',
            'schedule': 86400.0,
        },
        'monthly-report': {
            'task': 'tasks.reports.generate_monthly_report',
            'schedule': 2592000.0,
        },
    }
