import os
import datetime
from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
from functools import wraps

app = Flask(__name__)

# --- Configuration & Security ---
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-wildguard-key-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wildguard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True)

# --- Database Models ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)

class Species(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # e.g., Endangered, Vulnerable
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

# --- Security Decorators ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('auth_token')
        if not token:
            return jsonify({'message': 'Authentication token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'Invalid token.'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid or expired!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('auth_token')
        if not token:
            return jsonify({'message': 'Authentication token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'Invalid token.'}), 401
            if current_user.role != 'admin':
                return jsonify({'message': 'Admin privilege required!'}), 403
        except Exception as e:
            return jsonify({'message': 'Token is invalid or expired!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- Public APIs (To drive your Frontend dynamically) ---

@app.route('/api/settings', methods=['GET'])
def get_public_settings():
    """Public route: Allows your website to display up-to-date custom text dynamically."""
    settings = Setting.query.all()
    settings_dict = {s.key: s.value for s in settings}
    return jsonify(settings_dict), 200

@app.route('/api/species', methods=['GET'])
def get_public_species():
    """Public route: Fetches wildlife records for display cards on the site."""
    species_list = Species.query.all()
    output = [{'id': s.id, 'name': s.name, 'status': s.status, 'description': s.description, 'image_url': s.image_url} for s in species_list]
    return jsonify({'species': output}), 200

@app.route('/api/contact', methods=['POST'])
def receive_message():
    data = request.get_json() or {}
    if not all(k in data for k in ('name', 'email', 'subject', 'content')):
        return jsonify({'message': 'Missing fields.'}), 400
    new_msg = Message(name=data['name'], email=data['email'], subject=data['subject'], content=data['content'])
    db.session.add(new_msg)
    db.session.commit()
    return jsonify({'message': 'Message sent successfully!'}), 201

# --- User Authentication APIs ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 400
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(email=email, password_hash=hashed_pw, role='user')
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        token = jwt.encode({'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)}, app.config['SECRET_KEY'], algorithm='HS256')
        response = make_response(jsonify({'message': 'Login successful', 'role': user.role}))
        response.set_cookie('auth_token', token, httponly=True, secure=True, samesite='Strict')
        return response
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'id': current_user.id, 'email': current_user.email, 'role': current_user.role})

# --- Administrative Guarded APIs ---

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        if user.role != 'admin':
            return jsonify({'message': 'Admin access required.'}), 403
        token = jwt.encode({'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)}, app.config['SECRET_KEY'], algorithm='HS256')
        response = make_response(jsonify({'message': 'Login successful.', 'authenticated': True, 'role': user.role}))
        response.set_cookie('auth_token', token, httponly=True, secure=True, samesite='Strict')
        return response
    return jsonify({'message': 'Invalid credentials.'}), 401

@app.route('/api/admin/verify', methods=['POST'])
@admin_required
def verify_admin(current_user):
    """Verify admin token and return admin info."""
    return jsonify({'message': 'Admin verified', 'user_id': current_user.id, 'email': current_user.email, 'role': current_user.role}), 200

@app.route('/api/admin/settings', methods=['PUT'])
@admin_required
def update_settings(current_user):
    """Admin Route: Completely modify configuration texts and parameters across the system."""
    data = request.get_json() or {}
    for key, value in data.items():
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
    db.session.commit()
    return jsonify({'message': 'Site settings updated successfully.'}), 200

@app.route('/api/admin/species', methods=['POST'])
@admin_required
def add_species(current_user):
    """Admin Route: Insert a new wildlife tracking item."""
    data = request.get_json() or {}
    if not all(k in data for k in ('name', 'status', 'description')):
        return jsonify({'message': 'Missing data fields.'}), 400
    new_animal = Species(name=data['name'], status=data['status'], description=data['description'], image_url=data.get('image_url'))
    db.session.add(new_animal)
    db.session.commit()
    return jsonify({'message': 'Species item added.'}), 201

@app.route('/api/admin/species/<int:id>', methods=['PUT'])
@admin_required
def update_species(current_user, id):
    """Admin Route: Update an existing wildlife tracking item."""
    data = request.get_json() or {}
    animal = Species.query.get_or_404(id)
    if 'name' in data:
        animal.name = data['name']
    if 'status' in data:
        animal.status = data['status']
    if 'description' in data:
        animal.description = data['description']
    if 'image_url' in data:
        animal.image_url = data['image_url']
    db.session.commit()
    return jsonify({'message': 'Species item updated.'}), 200

@app.route('/api/admin/species/<int:id>', methods=['DELETE'])
@admin_required
def delete_species(current_user, id):
    """Admin Route: Delete an existing item."""
    animal = Species.query.get_or_404(id)
    db.session.delete(animal)
    db.session.commit()
    return jsonify({'message': 'Species item removed.'}), 200

@app.route('/api/admin/messages', methods=['GET'])
@admin_required
def get_admin_messages(current_user):
    messages = Message.query.order_by(Message.created_at.desc()).all()
    output = [{'id': m.id, 'name': m.name, 'email': m.email, 'subject': m.subject, 'content': m.content, 'created_at': m.created_at.strftime('%Y-%m-%d %H:%M:%S')} for m in messages]
    return jsonify({'messages': output}), 200

@app.route('/api/admin/messages/<int:id>', methods=['DELETE'])
@admin_required
def delete_message(current_user, id):
    message = Message.query.get_or_404(id)
    db.session.delete(message)
    db.session.commit()
    return jsonify({'message': 'Message deleted successfully.'}), 200

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    response = make_response(jsonify({'message': 'Logged out.'}))
    response.set_cookie('auth_token', '', expires=0)
    return response

# --- Database Automatic Seeding ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Seed Admin Users
        admin_emails = ['wildguardsociety@gmail.com', 'shedrackanderson576@gmail.com']
        default_password = 'SecurePass123!'  # Change this in production
        for email in admin_emails:
            if not User.query.filter_by(email=email).first():
                hashed_pw = bcrypt.generate_password_hash(default_password).decode('utf-8')
                user = User(email=email, password_hash=hashed_pw, role='admin')
                db.session.add(user)
        # Write credentials to file
        try:
            with open('admin_credentials.txt', 'w') as f:
                f.write('Admin Credentials:\n')
                for email in admin_emails:
                    f.write(f'Email: {email}, Password: {default_password}\n')
        except Exception as e:
            print(f'Could not write credentials file: {e}')
        
        # Seed Basic Config Defaults
        defaults = {
            'site_name': 'WildGuard Society',
            'hero_title': 'Get in touch with our team.',
            'hero_subtitle': 'If you want to collaborate, report a content issue, or extend the site...',
            'contact_email': 'info@wildlifeexplorer.org'
        }
        for k, v in defaults.items():
            if not Setting.query.filter_by(key=k).first():
                db.session.add(Setting(key=k, value=v))
        
        db.session.commit()
        print("Backend ready. Seed data injected correctly.")
        
    app.run(debug=True, port=5000)
