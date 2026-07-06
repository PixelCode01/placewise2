from flask import Flask, jsonify, send_from_directory
import os
import logging
from logging.handlers import RotatingFileHandler
from config import Config
from extensions import db, jwt, celery


def create_app(config_dict=None):
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(Config)
    if config_dict:
        app.config.update(config_dict)

    # --- Setup Logging ---
    if not os.path.exists('logs'):
        os.mkdir('logs')
        
    file_handler = RotatingFileHandler('logs/ppa.log', maxBytes=1024000, backupCount=10)
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Placement Portal Application startup')

    db.init_app(app)
    jwt.init_app(app)

    celery.conf.update(
        broker_url=app.config.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
        result_backend=app.config.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
        beat_schedule=app.config.get('CELERYBEAT_SCHEDULE', {}),
        task_serializer='json',
        result_serializer='json',
        accept_content=['json'],
    )

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({'error': 'token expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({'error': 'invalid token'}), 401

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({'error': 'authorization required'}), 401

    from models import User, Company, Student, PlacementDrive, Application, Placement
    from seed import init_db

    if not app.config.get('TESTING'):
        init_db(app)

    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.company import company_bp
    from routes.student import student_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    @app.route('/')
    def index():
        return app.send_static_file('index.html')

    @app.route('/resumes/<path:filename>')
    def serve_resume(filename):
        resume_dir = os.path.join(app.root_path, '..', 'frontend', 'resumes')
        return send_from_directory(resume_dir, filename)

    @app.route('/exports/<path:filename>')
    def serve_export(filename):
        export_dir = os.path.join(app.root_path, '..', 'frontend', 'exports')
        return send_from_directory(export_dir, filename)

    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'not found'}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'internal server error'}, 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        return jsonify({
            "error": "An unexpected server error occurred.",
            "details": str(e)
        }), 500

    return app
