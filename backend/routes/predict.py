"""
routes/predict.py — /api/predict endpoint.
"""

import json
from flask import Blueprint, request, jsonify, session
from ml.predictor import predict
from database.models import db, PredictionHistory

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/predict", methods=["POST"])
def predict_disease():
    data = request.get_json(silent=True) or {}
    symptoms = data.get("symptoms", [])

    if not symptoms or not isinstance(symptoms, list):
        return jsonify({"error": "Please provide a list of symptoms."}), 400

    if len(symptoms) < 1:
        return jsonify({"error": "At least one symptom is required."}), 400

    if len(symptoms) > 30:
        return jsonify({"error": "Too many symptoms. Maximum is 30."}), 400

    try:
        result = predict(symptoms, top_n=5)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    # Save to history
    try:
        session_id = session.get("session_id", "anonymous")
        top = result["predictions"][0] if result["predictions"] else {}
        record = PredictionHistory(
            session_id=session_id,
            symptoms=json.dumps(symptoms),
            top_disease=top.get("disease"),
            overall_severity=result.get("overall_severity"),
            confidence=top.get("confidence"),
            full_result=json.dumps(result),
        )
        db.session.add(record)
        db.session.commit()
        result["history_id"] = record.id
    except Exception:
        pass  # History save failing shouldn't break the response

    result["disclaimer"] = (
        "⚠ This tool is for informational purposes only. "
        "It is not a substitute for professional medical advice, diagnosis, or treatment. "
        "Always consult a qualified healthcare provider."
    )

    return jsonify(result), 200
