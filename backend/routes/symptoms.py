"""
routes/symptoms.py — /api/symptoms and /api/chat endpoints.
"""

import os
import requests
from flask import Blueprint, request, jsonify
from ml.dataset import ALL_SYMPTOMS, SYMPTOM_DISPLAY, DISEASE_PROFILES

symptoms_bp = Blueprint("symptoms", __name__)


@symptoms_bp.route("/symptoms", methods=["GET"])
def get_symptoms():
    """Return all available symptoms with display names."""
    q = request.args.get("q", "").lower()
    result = [
        {"key": s, "label": SYMPTOM_DISPLAY[s]}
        for s in ALL_SYMPTOMS
        if not q or q in s or q in SYMPTOM_DISPLAY[s].lower()
    ]
    return jsonify({"symptoms": result, "total": len(result)}), 200


@symptoms_bp.route("/diseases", methods=["GET"])
def get_diseases():
    """Return list of diseases the model can predict."""
    diseases = [
        {
            "name":     name,
            "severity": p["severity"],
            "icd":      p.get("icd", ""),
            "symptoms_count": len(p.get("core", [])) + len(p.get("common", [])),
        }
        for name, p in DISEASE_PROFILES.items()
    ]
    return jsonify({"diseases": diseases}), 200


@symptoms_bp.route("/suggestions", methods=["POST"])
def symptom_suggestions():
    """Return smart symptom suggestions based on already-selected symptoms."""
    data = request.get_json(silent=True) or {}
    selected = set(data.get("symptoms", []))

    related_map = {
        "fever":            ["chills", "headache", "body_aches", "fatigue", "night_sweats"],
        "headache":         ["nausea", "sensitivity_to_light", "blurred_vision", "dizziness"],
        "cough":            ["sore_throat", "shortness_of_breath", "chest_pain", "runny_nose"],
        "fatigue":          ["body_aches", "joint_pain", "night_sweats", "weight_loss"],
        "nausea":           ["vomiting", "abdominal_pain", "diarrhea", "loss_of_appetite"],
        "abdominal_pain":   ["nausea", "bloating", "diarrhea", "constipation"],
        "chest_pain":       ["shortness_of_breath", "palpitations", "dizziness"],
        "rash":             ["itching", "fever", "swollen_lymph_nodes"],
        "diarrhea":         ["abdominal_pain", "nausea", "vomiting", "fatigue"],
        "frequent_urination": ["excessive_thirst", "painful_urination", "blurred_vision"],
    }

    pool = set()
    for sym in selected:
        sym_key = sym.lower().replace(" ", "_")
        for rel in related_map.get(sym_key, []):
            if rel not in selected:
                pool.add(rel)

    suggestions = [
        {"key": s, "label": SYMPTOM_DISPLAY.get(s, s.replace("_", " ").title())}
        for s in list(pool)[:8]
        if s in ALL_SYMPTOMS
    ]

    return jsonify({"suggestions": suggestions}), 200


@symptoms_bp.route("/chat", methods=["POST"])
def chat():
    """Proxy chat messages to Anthropic API."""
    data = request.get_json(silent=True) or {}
    messages  = data.get("messages", [])
    lang      = data.get("lang", "en")
    api_key   = os.getenv("ANTHROPIC_API_KEY", "")

    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not configured."}), 503

    lang_name = "Swahili" if lang == "sw" else "English"
    system = (
        f"You are MedSense AI, a helpful and empathetic medical information assistant. "
        f"You help users understand symptoms, possible conditions, and general health guidance. "
        f"Always include a reminder that you are not a substitute for professional medical advice. "
        f"Be concise (3-5 sentences). Respond in {lang_name}."
    )

    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key":         api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type":      "application/json",
            },
            json={
                "model":      "claude-sonnet-4-20250514",
                "max_tokens": 512,
                "system":     system,
                "messages":   messages,
            },
            timeout=30,
        )
        resp.raise_for_status()
        reply = resp.json()["content"][0]["text"]
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500
