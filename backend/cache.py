import redis
import json
from flask import current_app

def get_redis():
    url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/1')
    return redis.Redis.from_url(url, decode_responses=True)


def cache_get(key):
    try:
        if current_app.config.get('TESTING'):
            return None
        r = get_redis()
        value = r.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception:
        return None


def cache_set(key, value, ttl=300):
    try:
        if current_app.config.get('TESTING'):
            return
        r = get_redis()
        r.set(key, json.dumps(value), ex=ttl)
    except Exception:
        pass


def cache_delete(*keys):
    try:
        r = get_redis()
        for key in keys:
            r.delete(key)
    except Exception:
        pass
