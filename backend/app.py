"""
Blububb Pastry'n Cake - Backend API
Flask backend with JSON file storage
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='../', static_url_path='/')
CORS(app)

# Configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ===========================
# STATIC FILE SERVING
# ===========================

@app.route('/')
def serve_index():
    """Serve the main index.html"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve other static files"""
    # Check if file exists in static folder
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Return index.html for SPA routing (optional, but good for safety)
    return send_from_directory(app.static_folder, 'index.html')


# ===========================
# HELPER FUNCTIONS
# ===========================

def load_json(filename):
    """Load data from JSON file"""
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_json(filename, data):
    """Save data to JSON file"""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_id():
    """Generate unique ID"""
    return str(uuid.uuid4())[:8]


# ===========================
# PRODUCTS API
# ===========================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    data = load_json('products.json')
    products = data.get('products', [])
    
    # Filter by category if provided
    category = request.args.get('category')
    if category:
        products = [p for p in products if p.get('category', '').lower() == category.lower()]
    
    # Filter featured only if requested
    featured = request.args.get('featured')
    if featured and featured.lower() == 'true':
        products = [p for p in products if p.get('featured', False)]
    
    return jsonify({
        'success': True,
        'data': products,
        'count': len(products)
    })


@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product by ID"""
    data = load_json('products.json')
    products = data.get('products', [])
    
    product = next((p for p in products if p['id'] == product_id), None)
    
    if product:
        return jsonify({'success': True, 'data': product})
    return jsonify({'success': False, 'error': 'Product not found'}), 404


@app.route('/api/products', methods=['POST'])
def create_product():
    """Create new product"""
    data = load_json('products.json')
    products = data.get('products', [])
    
    new_product = request.json
    new_product['id'] = generate_id()
    new_product['status'] = 'active'
    
    products.append(new_product)
    data['products'] = products
    save_json('products.json', data)
    
    return jsonify({'success': True, 'data': new_product}), 201


@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    """Update product"""
    data = load_json('products.json')
    products = data.get('products', [])
    
    for i, product in enumerate(products):
        if product['id'] == product_id:
            products[i].update(request.json)
            data['products'] = products
            save_json('products.json', data)
            return jsonify({'success': True, 'data': products[i]})
    
    return jsonify({'success': False, 'error': 'Product not found'}), 404


@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete product"""
    data = load_json('products.json')
    products = data.get('products', [])
    
    initial_count = len(products)
    products = [p for p in products if p['id'] != product_id]
    
    if len(products) < initial_count:
        data['products'] = products
        save_json('products.json', data)
        return jsonify({'success': True, 'message': 'Product deleted'})
    
    return jsonify({'success': False, 'error': 'Product not found'}), 404


# ===========================
# MEMBERS API
# ===========================

@app.route('/api/members', methods=['GET'])
def get_members():
    """Get all members"""
    data = load_json('members.json')
    members = data.get('members', [])
    
    # Don't expose password hashes
    for member in members:
        member.pop('password_hash', None)
    
    return jsonify({
        'success': True,
        'data': members,
        'count': len(members)
    })


@app.route('/api/members/<member_id>', methods=['GET'])
def get_member(member_id):
    """Get single member by ID"""
    data = load_json('members.json')
    members = data.get('members', [])
    
    member = next((m for m in members if m['id'] == member_id), None)
    
    if member:
        member_copy = member.copy()
        member_copy.pop('password_hash', None)
        return jsonify({'success': True, 'data': member_copy})
    return jsonify({'success': False, 'error': 'Member not found'}), 404


@app.route('/api/members/register', methods=['POST'])
def register_member():
    """Register new member"""
    data = load_json('members.json')
    members = data.get('members', [])
    
    new_member = request.json
    
    # Check if email already exists
    if any(m['email'] == new_member.get('email') for m in members):
        return jsonify({'success': False, 'error': 'Email already registered'}), 400
    
    new_member['id'] = generate_id()
    new_member['joined_date'] = datetime.now().strftime('%Y-%m-%d')
    new_member['total_orders'] = 0
    new_member['status'] = 'active'
    # In production, hash the password properly
    new_member['password_hash'] = new_member.pop('password', '')
    
    members.append(new_member)
    data['members'] = members
    save_json('members.json', data)
    
    # Don't return password hash
    new_member.pop('password_hash', None)
    return jsonify({'success': True, 'data': new_member}), 201


@app.route('/api/members/login', methods=['POST'])
def login_member():
    """Login member"""
    data = load_json('members.json')
    members = data.get('members', [])
    
    credentials = request.json
    email = credentials.get('email')
    password = credentials.get('password')
    
    member = next((m for m in members if m['email'] == email), None)
    
    if member and member.get('password_hash') == password:  # In production, use proper password verification
        member_copy = member.copy()
        member_copy.pop('password_hash', None)
        return jsonify({'success': True, 'data': member_copy})
    
    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401


# ===========================
# TRANSACTIONS API
# ===========================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    data = load_json('transactions.json')
    transactions = data.get('transactions', [])
    
    # Filter by status if provided
    status = request.args.get('status')
    if status:
        transactions = [t for t in transactions if t.get('status', '').lower() == status.lower()]
    
    # Sort by date (newest first)
    transactions = sorted(transactions, key=lambda x: x.get('date', ''), reverse=True)
    
    return jsonify({
        'success': True,
        'data': transactions,
        'count': len(transactions)
    })


@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    """Create new transaction (order)"""
    data = load_json('transactions.json')
    transactions = data.get('transactions', [])
    
    new_transaction = request.json
    new_transaction['id'] = f"BLB{len(transactions) + 1:03d}"
    new_transaction['date'] = datetime.now().strftime('%Y-%m-%d')
    new_transaction['status'] = 'pending'
    
    transactions.append(new_transaction)
    data['transactions'] = transactions
    save_json('transactions.json', data)
    
    return jsonify({'success': True, 'data': new_transaction}), 201


@app.route('/api/transactions/<transaction_id>/status', methods=['PUT'])
def update_transaction_status(transaction_id):
    """Update transaction status"""
    data = load_json('transactions.json')
    transactions = data.get('transactions', [])
    
    new_status = request.json.get('status')
    
    for i, transaction in enumerate(transactions):
        if transaction['id'] == transaction_id:
            transactions[i]['status'] = new_status
            data['transactions'] = transactions
            save_json('transactions.json', data)
            return jsonify({'success': True, 'data': transactions[i]})
    
    return jsonify({'success': False, 'error': 'Transaction not found'}), 404


# ===========================
# REPORTS / ANALYTICS API
# ===========================

@app.route('/api/reports/summary', methods=['GET'])
def get_summary():
    """Get dashboard summary stats"""
    products_data = load_json('products.json')
    members_data = load_json('members.json')
    transactions_data = load_json('transactions.json')
    
    products = products_data.get('products', [])
    members = members_data.get('members', [])
    transactions = transactions_data.get('transactions', [])
    
    total_revenue = sum(t.get('total', 0) for t in transactions if t.get('status') == 'completed')
    
    return jsonify({
        'success': True,
        'data': {
            'total_products': len(products),
            'total_members': len(members),
            'total_transactions': len(transactions),
            'total_revenue': total_revenue,
            'pending_orders': len([t for t in transactions if t.get('status') == 'pending'])
        }
    })


# ===========================
# IMAGE UPLOAD API
# ===========================

@app.route('/api/upload', methods=['POST'])
def upload_image():
    """Upload product image"""
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to filename to avoid conflicts
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{datetime.now().strftime('%Y%m%d%H%M%S')}{ext}"
        
        filepath = os.path.join(UPLOAD_DIR, filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'url': f'/uploads/{filename}'
        })
    
    return jsonify({'success': False, 'error': 'Invalid file type'}), 400


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(UPLOAD_DIR, filename)


# ===========================
# ADMIN AUTH (Simple)
# ===========================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login (simple auth for demo)"""
    credentials = request.json
    username = credentials.get('username')
    password = credentials.get('password')
    
    # Simple demo credentials - in production use proper auth
    if username == 'admin' and password == 'blububb123':
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {'username': 'admin', 'role': 'admin'}
        })
    
    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401


# ===========================
# MAIN
# ===========================

if __name__ == '__main__':
    print("🧁 Blububb Backend Server Starting...")
    print(f"📁 Data Directory: {DATA_DIR}")
    print(f"📷 Upload Directory: {UPLOAD_DIR}")
    print("🚀 Server running at http://localhost:5000")
    app.run(debug=True, port=5000)
