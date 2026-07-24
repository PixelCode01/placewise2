from app import create_app
from extensions import celery, db

flask_app = create_app()

class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with flask_app.app_context():
            db.session.remove()
            try:
                return self.run(*args, **kwargs)
            finally:
                db.session.remove()

celery.Task = ContextTask
