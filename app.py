import os
import datetime
from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import jwt
from functools import wraps

app = Flask(__name__)

# Add root route BEFORE static folder setup to take precedence
@app.route('/')
def serve_index():
    from flask import send_from_directory
    return send_from_directory('.', 'index.html')

# Serve static files from root
app.static_folder = '.'
app.static_url_path = ''

# Explicitly serve all HTML files and assets
@app.route('/<path:filename>')
def serve_static(filename):
    from flask import send_from_directory
    try:
        return send_from_directory('.', filename)
    except:
        from flask import send_from_directory
        return send_from_directory('.', 'index.html'), 404

# --- Configuration & Security ---
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-wildguard-key-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wildguard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True)

# --- SocketIO for Real-time Live Feed ---
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', logger=True, engineio_logger=True)

# --- Database Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_online = db.Column(db.Boolean, default=False)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    read = db.Column(db.Boolean, default=False)
    replied = db.Column(db.Boolean, default=False)

class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)

class Scan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    species_name = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Integer, nullable=False)
    image_data = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Favourite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    species_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Species(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

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

# --- SocketIO Event Handlers for Real-time Live Feed ---
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'status': 'connected', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join_user_room')
def handle_join_user_room(data):
    user_email = data.get('email')
    if user_email:
        room = f"user_{user_email}"
        join_room(room)
        emit('joined_room', {'room': room})

@socketio.on('join_admin_room')
def handle_join_admin_room():
    join_room('admins')
    emit('joined_room', {'room': 'admins'})

@socketio.on('request_stats_update')
def handle_stats_request():
    stats = {
        'total_users': User.query.count(),
        'total_messages': Message.query.count(),
        'total_species': Species.query.count(),
        'pending_scans': Scan.query.count(),
        'online_users': User.query.filter_by(is_online=True).count(),
        'timestamp': datetime.datetime.utcnow().isoformat()
    }
    emit('stats_update', stats, room='admins')

@socketio.on('admin_broadcast')
def handle_admin_broadcast(data):
    """Admin sends broadcast message to users"""
    recipients = data.get('recipients', [])
    subject = data.get('subject', '')
    body = data.get('body', '')
    
    for email in recipients:
        socketio.emit('notification', {
            'type': 'admin_broadcast',
            'title': data.get('subject', 'Admin Message'),
            'body': data.get('body', ''),
            'from': 'WildGuard Admin',
            'timestamp': datetime.datetime.utcnow().isoformat()
        }, room=f"user_{email}")
    
    socketio.emit('broadcast_sent', {
        'admin': 'admin',
        'recipients': len(recipients),
        'subject': data.get('subject', ''),
        'timestamp': datetime.datetime.utcnow().isoformat()
    }, room='admins')

# Background task for periodic stats updates
def background_stats_updater():
    while True:
        socketio.sleep(30)
        with app.app_context():
            stats = {
                'total_users': User.query.count(),
                'total_messages': Message.query.count(),
                'total_species': Species.query.count(),
                'pending_scans': Scan.query.count(),
                'online_users': User.query.filter_by(is_online=True).count(),
                'timestamp': datetime.datetime.utcnow().isoformat()
            }
            socketio.emit('stats_update', stats, room='admins')

# Start background task
@socketio.on('connect')
def start_background_tasks():
    socketio.start_background_task(background_stats_updater)

# --- Public APIs (To drive your Frontend dynamically) ---

@app.route('/api/settings', methods=['GET'])
def get_public_settings():
    settings = Setting.query.all()
    settings_dict = {s.key: s.value for s in settings}
    return jsonify(settings_dict), 200

@app.route('/api/species', methods=['GET'])
def get_public_species():
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
    
    # Real-time notification to admins
    socketio.emit('new_message', {
        'id': new_msg.id,
        'name': new_msg.name,
        'email': new_msg.email,
        'subject': new_msg.subject,
        'content': new_msg.content,
        'created_at': new_msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }, room='admins')
    
    # Also notify the user
    socketio.emit('notification', {
        'type': 'message_sent',
        'title': 'Message Received',
        'body': f'Your message "{new_msg.subject}" has been received. We\'ll get back to you soon.',
        'timestamp': datetime.datetime.utcnow().isoformat()
    }, room=f"user_{new_msg.email}")
    
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
    
    # Log activity
    log_activity(None, 'user_registered', {'email': email})
    
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
        user.last_seen = datetime.datetime.utcnow()
        user.is_online = True
        db.session.commit()
        response = make_response(jsonify({'message': 'Login successful', 'role': user.role}))
        response.set_cookie('auth_token', token, httponly=True, samesite='Lax')
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
        response.set_cookie('auth_token', token, httponly=True, samesite='Lax')
        return response
    return jsonify({'message': 'Invalid credentials.'}), 401

@app.route('/api/admin/verify', methods=['POST'])
@admin_required
def verify_admin(current_user):
    return jsonify({'message': 'Admin verified', 'user_id': current_user.id, 'email': current_user.email, 'role': current_user.role}), 200

@app.route('/api/admin/settings', methods=['PUT'])
@admin_required
def update_settings(current_user):
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
    animal = Species.query.get_or_404(id)
    db.session.delete(animal)
    db.session.commit()
    return jsonify({'message': 'Species item removed.'}), 200

@app.route('/api/admin/messages', methods=['GET'])
@admin_required
def get_admin_messages(current_user):
    messages = Message.query.order_by(Message.created_at.desc()).all()
    output = [{'id': m.id, 'name': m.name, 'email': m.email, 'subject': m.subject, 'content': m.content, 'created_at': m.created_at.strftime('%Y-%m-%d %H:%M:%S'), 'read': m.read} for m in messages]
    return jsonify({'messages': output}), 200

@app.route('/api/admin/messages/<int:id>', methods=['DELETE'])
@admin_required
def delete_message(current_user, id):
    message = Message.query.get_or_404(id)
    db.session.delete(message)
    db.session.commit()
    return jsonify({'message': 'Message deleted successfully.'}), 200

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats(current_user):
    total_species = Species.query.count()
    total_messages = Message.query.count()
    total_users = User.query.count()
    pending_scans = Scan.query.count()
    return jsonify({'total_species': total_species, 'total_messages': total_messages, 'total_users': total_users, 'pending_scans': pending_scans}), 200

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_admin_users(current_user):
    users = User.query.all()
    output = [{'id': u.id, 'email': u.email, 'role': u.role, 'created_at': u.created_at.strftime('%Y-%m-%d %H:%M:%S'), 'is_online': u.is_online, 'last_seen': u.last_seen.strftime('%Y-%m-%d %H:%M:%S') if u.last_seen else None} for u in users]
    return jsonify({'users': output}), 200

# --- User Profile & Data APIs ---

@app.route('/api/user/scans', methods=['GET'])
@token_required
def get_user_scans(current_user):
    scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all()
    output = [{'id': s.id, 'species_name': s.species_name, 'confidence': s.confidence, 'image_data': s.image_data, 'created_at': s.created_at.strftime('%Y-%m-%d %H:%M:%S')} for s in scans]
    return jsonify({'scans': output}), 200

@app.route('/api/user/scans', methods=['POST'])
@token_required
def add_user_scan(current_user):
    data = request.get_json() or {}
    if 'species_name' not in data or 'confidence' not in data:
        return jsonify({'message': 'Missing required fields'}), 400
    scan = Scan(user_id=current_user.id, species_name=data['species_name'], confidence=data['confidence'], image_data=data.get('image_data'))
    db.session.add(scan)
    db.session.commit()
    return jsonify({'message': 'Scan saved', 'id': scan.id}), 201

@app.route('/api/user/favourites', methods=['GET'])
@token_required
def get_user_favourites(current_user):
    favourites = Favourite.query.filter_by(user_id=current_user.id).order_by(Favourite.created_at.desc()).all()
    output = [{'id': f.id, 'species_name': f.species_name, 'created_at': f.created_at.strftime('%Y-%m-%d %H:%M:%S')} for f in favourites]
    return jsonify({'favourites': output}), 200

@app.route('/api/user/favourites', methods=['POST'])
@token_required
def add_user_favourite(current_user):
    data = request.get_json() or {}
    if 'species_name' not in data:
        return jsonify({'message': 'Missing species_name'}), 400
    existing = Favourite.query.filter_by(user_id=current_user.id, species_name=data['species_name']).first()
    if existing:
        return jsonify({'message': 'Already in favourites'}), 400
    fav = Favourite(user_id=current_user.id, species_name=data['species_name'])
    db.session.add(fav)
    db.session.commit()
    return jsonify({'message': 'Added to favourites', 'id': fav.id}), 201

@app.route('/api/user/favourites/<int:id>', methods=['DELETE'])
@token_required
def delete_user_favourite(current_user, id):
    fav = Favourite.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    db.session.delete(fav)
    db.session.commit()
    return jsonify({'message': 'Removed from favourites'}), 200

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    scans_count = Scan.query.filter_by(user_id=current_user.id).count()
    favs_count = Favourite.query.filter_by(user_id=current_user.id).count()
    return jsonify({'id': current_user.id, 'email': current_user.email, 'role': current_user.role, 'scans_count': scans_count, 'favourites_count': favs_count, 'created_at': current_user.created_at.strftime('%Y-%m-%d %H:%M:%S')}), 200

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    response = make_response(jsonify({'message': 'Logged out.'}))
    response.set_cookie('auth_token', '', expires=0)
    return response

# --- Email & Broadcast Endpoints ---

@app.route('/api/admin/send-email', methods=['POST'])
@admin_required
def send_email(current_user):
    data = request.get_json() or {}
    required = ['to', 'subject', 'body']
    if not all(k in data for k in required):
        return jsonify({'message': 'Missing required fields: to, subject, body'}), 400
    
    try:
        import json
        admin_emails = ['wildguardsociety@gmail.com', 'shedrackanderson576@gmail.com']
        log_entry = {
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'action': 'email_sent',
            'admin': current_user.email,
            'to': data['to'],
            'subject': data['subject']
        }
        print(f"EMAIL SENT: {json.dumps(log_entry)}")
        return jsonify({'message': 'Email queued for delivery', 'email': data['to']}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to send email', 'error': str(e)}), 500

@app.route('/api/admin/broadcast', methods=['POST'])
@admin_required
def broadcast_message(current_user):
    data = request.get_json() or {}
    if 'recipients' not in data or 'subject' not in data or 'body' not in data:
        return jsonify({'message': 'Missing required fields: recipients (list), subject, body'}), 400
    
    recipients = data['recipients']
    if not isinstance(recipients, list) or not recipients:
        return jsonify({'message': 'Recipients must be a non-empty list'}), 400
    
    valid_emails = []
    for email in recipients:
        user = User.query.filter_by(email=email).first()
        if user:
            valid_emails.append(email)
        else:
            valid_emails.append(email)
    
    try:
        import json
        log_entry = {
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'action': 'broadcast_sent',
            'admin': current_user.email,
            'recipients': valid_emails,
            'subject': data['subject']
        }
        for email in valid_emails:
            socketio.emit('notification', {
                'type': 'admin_broadcast',
                'title': data['subject'],
                'body': data['body'],
                'from': 'WildGuard Admin',
                'timestamp': datetime.datetime.utcnow().isoformat()
            }, room=f"user_{email}")
        
        socketio.emit('broadcast_sent', {
            'admin': current_user.email,
            'recipients': len(valid_emails),
            'subject': data['subject'],
            'timestamp': datetime.datetime.utcnow().isoformat()
        }, room='admins')
        
        print(f"BROADCAST SENT: {json.dumps(log_entry)}")
        return jsonify({'message': f'Broadcast queued for {len(valid_emails)} recipients', 'recipients': len(valid_emails)}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to send broadcast', 'error': str(e)}), 500

# --- Database Automatic Seeding ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Seed Admin Users - only if ADMIN_EMAIL and ADMIN_PASSWORD env vars are set
        admin_email = os.environ.get('ADMIN_EMAIL')
        admin_password = os.environ.get('ADMIN_PASSWORD')
        if admin_email and admin_password:
            if not User.query.filter_by(email=admin_email).first():
                hashed_pw = bcrypt.generate_password_hash(admin_password).decode('utf-8')
                user = User(email=admin_email, password_hash=hashed_pw, role='admin')
                db.session.add(user)
        
        # Seed Sample Species Data
        sample_species = [
            {
                'name': 'African Elephant',
                'status': 'Endangered',
                'description': 'The largest land mammal, known for its intelligence and complex social structures.',
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/3/37/African_Bush_Elephant.jpg'
            },
            {
                'name': 'Lion',
                'status': 'Vulnerable',
                'description': 'Known as the "King of the Jungle", lions live in prides and are apex predators.',
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg'
            },
            {
                'name': 'Giraffe',
                'status': 'Vulnerable',
                'description': 'The tallest land animal with a distinctive spotted coat and long neck.',
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/8/18/Giraffa_camelopardalis.jpg'
            },
            {
                'name': 'Leopard',
                'status': 'Vulnerable',
                'description': 'A solitary and elusive big cat known for its spotted coat and excellent climbing ability.',
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/d/de/Leopard_-_Sabi_Sands_PF.jpg'
            },
            {
                'name': 'Cheetah',
                'status': 'Vulnerable',
                'description': 'The fastest land animal, capable of reaching speeds up to 70 mph in short bursts.',
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Cheetah_on_the_Serengeti_Peninsula,_Serengeti,_Tanzania.jpg'
            }
        ]

        for species_data in sample_species:
            if not Species.query.filter_by(name=species_data['name']).first():
                species = Species(
                    name=species_data['name'],
                    status=species_data['status'],
                    description=species_data['description'],
                    image_url=species_data['image_url']
                )
                db.session.add(species)
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
    
    # Serve static HTML files - must be outside main block for test_client to work
    @app.route('/')
    def serve_index():
        return send_from_directory('.', 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        try:
            return send_from_directory('.', path)
        except:
            return send_from_directory('.', 'index.html'), 404

    if __name__ == '__main__':
        socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)