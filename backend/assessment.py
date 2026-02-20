from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

ROBOFLOW_API_KEY = "17jd8ELonR9vdIKc6rQB"
ROBOFLOW_MODEL = "waste-classifier-louut/1"

ROBOFLOW_URL = f"https://serverless.roboflow.com/{ROBOFLOW_MODEL}?api_key={ROBOFLOW_API_KEY}"

@app.route("/")
def home():
    return send_file("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]

        response = requests.post(
            ROBOFLOW_URL,
            files={"file": file}
        )

        data = response.json()

        if "predictions" not in data or len(data["predictions"]) == 0:
            return jsonify({
                "class_name": "unknown",
                "confidence": 0
            })

        best = max(data["predictions"], key=lambda x: x["confidence"])

        return jsonify({
            "class_name": best["class"].lower(),
            "confidence": round(best["confidence"] * 100, 2)
        })

    except Exception as e:
        print("🔥 BACKEND ERROR:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True)
