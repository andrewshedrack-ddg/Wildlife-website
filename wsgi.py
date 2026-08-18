"""Production WSGI entry point for WildGuard Society.

Run with gunicorn + eventlet worker:
    gunicorn -k eventlet -w 1 --timeout 120 wsgi:app

The Flask app already carries the Flask-SocketIO middleware (attached during
SocketIO init), so the same WSGI object serves both HTTP APIs and real-time
socket.io traffic.
"""
from app import app, socketio

# Expose the WSGI app for gunicorn/azure; `app` is the Flask app which has the
# SocketIO middleware wrapped around its wsgi_app by flask_socketio.
application = app


if __name__ == '__main__':
    socketio.run(app, debug=False, allow_unsafe_werkzeug=False)