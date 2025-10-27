# backend/app.py

import pickle
import random
from collections import defaultdict
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- SETUP ---
app = Flask(__name__)
# Allow your React app (running on localhost:3000) to access this server
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- LOAD THE .pkl MODEL ---
MODEL_PATH = 'personalized_word_bank.pkl' # Make sure this file is in the same folder
try:
    with open(MODEL_PATH, 'rb') as f:
        word_bank = pickle.load(f)
    # Create a flat list of all words for random selection (fallback)
    all_words = [word for sublist in word_bank.values() for word in sublist]
    print("Word bank loaded successfully.")
except FileNotFoundError:
    print(f"FATAL ERROR: The model file '{MODEL_PATH}' was not found.")
    print("Please make sure the .pkl file is in the same directory as this server.")
    exit()

# In-memory storage for the user's error profile.
# This resets every time the server restarts.
# For a real app, you would use a database.
user_error_profile = {}

# --- THE PERSONALIZATION LOGIC ---
def make_targeted_words(error_profile, num_words=50):
    # Get the user's top 5 most frequent errors, sorted
    problem_letters = sorted(error_profile, key=error_profile.get, reverse=True)[:5]

    output_words = []
    # Ratio of targeted words (e.g., 0.7 = 70%)
    TARGET_RATIO = 0.7

    for i in range(num_words):
        word = None
        # Check if we should generate a targeted word
        if problem_letters and random.random() < TARGET_RATIO:

            # Cycle through problem letters: t, a, s, t, a, s, ...
            target_letter = problem_letters[i % len(problem_letters)]

            # Ensure the target letter exists in the word bank and has words
            if word_bank.get(target_letter):
                word = random.choice(word_bank[target_letter])

        # If not a targeted word, or if a word couldn't be found, pick a random one
        if not word:
            word = random.choice(all_words)

        output_words.append(word)

    return output_words

# --- API Endpoints ---

# Endpoint to get a new list of words for the test (used by PracticeBox)
@app.route('/api/get_test')
def get_typing_test():
    print(f"Generating practice test based on profile: {user_error_profile}")
    personalized_test = make_targeted_words(user_error_profile)
    return jsonify(personalized_test)

# Endpoint to receive the list of mistakes from the frontend (used by PracticeBox)
@app.route('/api/log_mistake', methods=['POST'])
def log_mistake():
    data = request.get_json()
    letters = data.get('letters') # Expecting a list: ['t', 's', 'a', 't', 'e']

    # Basic validation
    if not isinstance(letters, list):
        return jsonify({"status": "error", "message": "Expected a 'letters' array"}), 400

    # Update the error profile based on the received mistakes
    mistakes_logged_count = 0
    for letter in letters:
        # Check if letter is a valid single character string
        if letter and isinstance(letter, str) and len(letter) == 1:
            # Increment the count for the incorrect letter
            user_error_profile[letter] = user_error_profile.get(letter, 0) + 1
            mistakes_logged_count += 1

    print(f"Logged {mistakes_logged_count} mistakes. New profile: {user_error_profile}")
    return jsonify({"status": "success", "profile": user_error_profile}), 200

# Start the Flask development server
if __name__ == '__main__':
    # debug=True helps see errors easily during development
    # host='0.0.0.0' makes it accessible on your local network if needed
    app.run(debug=True, host='0.0.0.0')