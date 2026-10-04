import os

import requests
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ROBOFLOW_MODEL = os.getenv("ROBOFLOW_MODEL", "waste-classifier-louut/1")


@app.route("/")
def home():
    return send_file("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    api_key = os.getenv("ROBOFLOW_API_KEY")
    if not api_key:
        return jsonify({"error": "Classification service is not configured"}), 503

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    image_bytes = image.read()
    if not image_bytes:
        return jsonify({"error": "Uploaded image is empty"}), 400

    try:
        response = requests.post(
            f"https://serverless.roboflow.com/{ROBOFLOW_MODEL}",
            params={"api_key": api_key},
            files={
                "file": (
                    image.filename or "waste-image",
                    image_bytes,
                    image.mimetype or "application/octet-stream",
                )
            },
            timeout=45,
        )
        response.raise_for_status()
        data = response.json()
        predictions = data.get("predictions")
        if not isinstance(predictions, list) or not predictions:
            return jsonify({"error": "No predictions returned"}), 502

        best = max(predictions, key=lambda item: float(item.get("confidence", 0)))
        if not isinstance(best.get("class"), str):
            return jsonify({"error": "Invalid prediction returned"}), 502

        return jsonify(
            {
                "class_name": best["class"].lower(),
                "confidence": round(float(best.get("confidence", 0)) * 100, 2),
            }
        )
    except requests.RequestException:
        app.logger.exception("Classification provider request failed")
        return jsonify({"error": "Classification provider is unavailable"}), 502
    except (ValueError, TypeError, AttributeError):
        app.logger.exception("Classification provider returned an invalid response")
        return jsonify({"error": "Invalid response from classification provider"}), 502
    except Exception:
        app.logger.exception("Unexpected classification error")
        return jsonify({"error": "Classification failed"}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=False)
