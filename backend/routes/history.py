"""
routes/history.py — /api/history and /api/feedback endpoints.
"""

import json
from flask import Blueprint, request, jsonify, session
from database.models import db, PredictionHistory, Feedback

history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
def get_history():
    session_id = session.get("session_id", "anonymous")
    limit = min(int(request.args.get("limit", 20)), 50)

    records = (
        PredictionHistory.query
        .filter_by(session_id=session_id)
        .order_by(PredictionHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return jsonify({"history": [r.to_dict() for r in records]}), 200


@history_bp.route("/history/<int:record_id>", methods=["GET"])
def get_history_item(record_id):
    record = PredictionHistory.query.get_or_404(record_id)
    return jsonify(record.to_dict()), 200


@history_bp.route("/history", methods=["DELETE"])
def clear_history():
    session_id = session.get("session_id", "anonymous")
    PredictionHistory.query.filter_by(session_id=session_id).delete()
    db.session.commit()
    return jsonify({"message": "History cleared."}), 200


@history_bp.route("/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json(silent=True) or {}
    history_id     = data.get("history_id")
    rating         = data.get("rating")          # correct | wrong | unsure
    actual_disease = data.get("actual_disease")
    notes          = data.get("notes", "")

    if not history_id or rating not in ("correct", "wrong", "unsure"):
        return jsonify({"error": "Invalid feedback data."}), 400

    # Update history record
    record = PredictionHistory.query.get(history_id)
    if record:
        record.feedback = rating
        fb = Feedback(
            history_id=history_id,
            actual_disease=actual_disease,
            rating=rating,
            notes=notes,
        )
        db.session.add(fb)
        db.session.commit()

    return jsonify({"message": "Feedback saved. Thank you!"}), 200


@history_bp.route("/stats", methods=["GET"])
def stats():
    session_id = session.get("session_id", "anonymous")
    total = PredictionHistory.query.filter_by(session_id=session_id).count()
    correct = PredictionHistory.query.filter_by(session_id=session_id, feedback="correct").count()
    return jsonify({
        "total_predictions": total,
        "correct_feedback":  correct,
        "accuracy_rate":     round(correct / total * 100, 1) if total > 0 else 0,
    }), 200
