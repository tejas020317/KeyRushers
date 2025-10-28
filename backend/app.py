# backend/app.py

import pickle
import random
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import os

# -------------------------------------------------
# Flask Setup
# -------------------------------------------------
app = Flask(__name__)
# Allow all origins for /api/* routes; adjust as needed
CORS(app, resources={r"/api/*": {"origins": "*"}})

# -------------------------------------------------
# Node Backend URL (replace with your deployed Node.js URL)
# -------------------------------------------------
NODE_BACKEND_URL = "https://keyrushers.onrender.com"  # 👈 update this if needed

# -------------------------------------------------
# Load Personalized Model (.pkl)
# -------------------------------------------------
MODEL_PATH = 'personalized_word_bank.pkl'

try:
    with open(MODEL_PATH, 'rb') as f:
        word_bank = pickle.load(f)
    all_words = [word for sublist in word_bank.values() for word in sublist]
    print("✅ Word bank loaded successfully.")
except FileNotFoundError:
    print(f"❌ ERROR: The model file '{MODEL_PATH}' was not found.")
    # Fail fast in container so Render shows a clear error
    raise

# -------------------------------------------------
# In-memory user profile
# -------------------------------------------------
user_error_profile = {}

# -------------------------------------------------
# Helper Function: Generate Targeted Words
# -------------------------------------------------
def make_targeted_words(error_profile, num_words=50):
    problem_letters = sorted(error_profile, key=error_profile.get, reverse=True)[:5]
    output_words = []
    TARGET_RATIO = 0.7

    for i in range(num_words):
        word = None
        if problem_letters and random.random() < TARGET_RATIO:
            target_letter = problem_letters[i % len(problem_letters)]
            if word_bank.get(target_letter):
                word = random.choice(word_bank[target_letter])
        if not word:
            word = random.choice(all_words)
        output_words.append(word)

    return output_words

# -------------------------------------------------
# Health Check (for Render)
# -------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    # Lightweight checks; extend if needed (e.g., attempt outbound ping or verify model present)
    return jsonify({"status": "ok"}), 200

# -------------------------------------------------
# Flask API Endpoints
# -------------------------------------------------
@app.route('/api/get_test', methods=['GET'])
def get_typing_test():
    print(f"🧠 Generating practice test based on: {user_error_profile}")
    personalized_test = make_targeted_words(user_error_profile)
    return jsonify(personalized_test), 200

@app.route('/api/log_mistake', methods=['POST'])
def log_mistake():
    data = request.get_json(silent=True) or {}
    letters = data.get('letters')

    if not isinstance(letters, list):
        return jsonify({"status": "error", "message": "Expected a 'letters' array"}), 400

    mistakes_logged_count = 0
    for letter in letters:
        if letter and isinstance(letter, str) and len(letter) == 1:
            user_error_profile[letter] = user_error_profile.get(letter, 0) + 1
            mistakes_logged_count += 1

    print(f"📝 Logged {mistakes_logged_count} mistakes. Profile: {user_error_profile}")
    return jsonify({"status": "success", "profile": user_error_profile}), 200

# -------------------------------------------------
# Example Endpoint: Communicate with Node Backend
# -------------------------------------------------
@app.route('/api/ping-node', methods=['GET'])
def ping_node():
    """Simple check to test Node <-> Python connection"""
    try:
        res = requests.get(f"{NODE_BACKEND_URL}/api/health", timeout=5)
        return jsonify({"node_response": res.json()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to contact Node backend: {str(e)}"}), 500

# -------------------------------------------------
# Local Dev Entry Point
# -------------------------------------------------
# Keep for local runs; Render will use Gunicorn to import backend.app:app
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Bind to 0.0.0.0 for local docker or cloud; use PORT if provided
    app.run(host='0.0.0.0', port=port)
