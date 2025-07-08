from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

app = Flask(__name__)

# Get API key and URL from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL_BASE = os.getenv("GEMINI_API_URL")
# Construct the full URL using the API key
GEMINI_API_URL = f"{GEMINI_API_URL_BASE}?key={GEMINI_API_KEY}"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message", "")
    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    payload = {
        "contents": [
            {"parts": [{"text": user_input}]}
        ]
    }
    
    headers = {"Content-Type": "application/json"}
    response = requests.post(GEMINI_API_URL, json=payload, headers=headers)
    if response.status_code != 200:
        return jsonify({"error": "API request failed", "details": response.text}), response.status_code

    data = response.json()
    print("Gemini API response:", data)  # For debugging

    bot_response = ""
    
    # Check if candidates exist in the response.
    if "candidates" in data and data["candidates"]:
        candidate = data["candidates"][0]
        # If the candidate has a "content" key, use it.
        if "content" in candidate:
            content = candidate["content"]
            if "parts" in content and isinstance(content["parts"], list):
                texts = [part.get("text", "").strip() for part in content["parts"] if part.get("text", "").strip()]
                bot_response = " ".join(texts)
            else:
                bot_response = content.get("text", "").strip()
        else:
            # Fallback if no "content" key is present.
            if "parts" in candidate and isinstance(candidate["parts"], list):
                texts = [part.get("text", "").strip() for part in candidate["parts"] if part.get("text", "").strip()]
                bot_response = " ".join(texts)
            else:
                bot_response = candidate.get("text", "").strip()
    else:
        bot_response = "No candidate found in API response."

    if not bot_response:
        bot_response = "No content provided."

    # Optional formatting: if multiple paragraphs exist, format as bullet points.
    paragraphs = [p.strip() for p in bot_response.split("\n") if p.strip()]
    if len(paragraphs) > 1:
        formatted_response = ""
        for p in paragraphs:
            formatted_response += f"• {p}<br><br>"
        bot_response = formatted_response

    return jsonify({"response": bot_response})

if __name__ == "__main__":
    app.run(debug=True)
