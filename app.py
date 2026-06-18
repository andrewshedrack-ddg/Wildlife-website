from flask import Flask, jsonify, send_from_directory, abort
import os

app = Flask(__name__, static_folder='.')

# Serve root index.html
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Serve static files (css, js, etc.)
@app.route('/<path:path>')
def static_files(path):
    # Prevent directory traversal
    if '..' in path or path.startswith('/'):
        abort(404)
    # Ensure file exists
    if os.path.isfile(path):
        return send_from_directory('.', path)
    # If not found, try to serve as is (maybe missing)
    abort(404)

# API endpoints
@app.route('/api/wildlife')
def api_wildlife():
    data = [
        {'name': 'African Lion', 'habitat': 'Savannah', 'fact': 'Lions are the only cats that live in groups called prides.'},
        {'name': 'African Elephant', 'habitat': 'Savanna & Forest', 'fact': 'Elephants have the longest pregnancy of any land animal—about 22 months.'},
        {'name': 'Cheetah', 'habitat': 'Grasslands', 'fact': 'Cheetahs can accelerate from 0 to 60 mph in just a few seconds.'},
        {'name': 'Giraffe', 'habitat': 'Savannah', 'fact': "A giraffe's neck is too short to reach the ground; it must splay its legs to drink."},
        {'name': 'Hippopotamus', 'habitat': 'Rivers & Lakes', 'fact': 'Despite their appearance, hippos can run faster than a human on land.'},
        {'name': 'African Fish Eagle', 'habitat': 'Wetlands', 'fact': "Their distinctive call is known as the 'voice of Africa'."},
        {'name': 'Nile Crocodile', 'habitat': 'Freshwater', 'fact': 'Nile crocodiles can hold their breath underwater for up to two hours.'},
        {'name': 'Leopard', 'habitat': 'Various', 'fact': 'Leopards are excellent climbers and often haul prey into trees.'},
        {'name': 'Black Rhinoceros', 'habitat': 'Savanna & Shrubland', 'fact': 'Black rhinos have a pointed upper lip for grasping leaves and twigs.'}
    ]
    return jsonify(data)

@app.route('/api/recommendations')
def api_recommendations():
    data = [
        {'title': 'Support Conservation NGOs', 'description': 'Donate to or volunteer with reputable wildlife protection organizations.'},
        {'title': 'Reduce Plastic Use', 'description': 'Plastic pollution harms marine and terrestrial wildlife; opt for reusable alternatives.'},
        {'title': 'Advocate for Protected Areas', 'description': 'Encourage governments to expand and maintain national parks and reserves.'},
        {'title': 'Educate Others', 'description': 'Share knowledge about wildlife importance and threats to foster community action.'},
        {'title': 'Choose Sustainable Products', 'description': 'Buy products certified as wildlife-friendly, like shade-grown coffee or FSC-certified wood.'}
    ]
    return jsonify(data)

@app.route('/api/team')
def api_team():
    data = [
        {'name': 'Alex Morgan', 'role': 'Founder & Lead Developer', 'bio': 'Passionate about merging technology with conservation to create real‑time impact.'},
        {'name': 'Dr. Samira Patel', 'role': 'Wildlife Biologist', 'bio': 'Expert in African megafauna, focusing on habitat restoration and community engagement.'},
        {'name': 'James Liu', 'role': 'UX Designer', 'bio': 'Creates intuitive interfaces that make conservation data accessible to all.'},
        {'name': 'WildGuard_Society', 'role': 'Community Outreach', 'bio': 'A youth movement turning conservation into action.'}
    ]
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
