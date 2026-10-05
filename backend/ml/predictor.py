"""
predictor.py — Load saved model and return disease predictions.
"""

import os
import json
import joblib
import numpy as np
from typing import List, Dict

from ml.dataset import DISEASE_PROFILES, ALL_SYMPTOMS

MODEL_DIR   = os.path.join(os.path.dirname(__file__), "saved")
MODEL_PATH  = os.path.join(MODEL_DIR, "model.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")

_model   = None
_encoder = None


def _load():
    global _model, _encoder
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                "Model not found. Run: python -m ml.train"
            )
        _model   = joblib.load(MODEL_PATH)
        _encoder = joblib.load(ENCODER_PATH)


def encode_symptoms(symptom_list: List[str]) -> np.ndarray:
    """Convert a list of symptom strings to a binary feature vector."""
    vec = np.zeros(len(ALL_SYMPTOMS), dtype=float)
    for sym in symptom_list:
        sym_key = sym.lower().replace(" ", "_")
        if sym_key in ALL_SYMPTOMS:
            vec[ALL_SYMPTOMS.index(sym_key)] = 1.0
    return vec


def predict(symptom_list: List[str], top_n: int = 5) -> Dict:
    """
    Returns top_n disease predictions with probabilities and metadata.

    Args:
        symptom_list: List of symptom strings (raw or underscored)
        top_n: Number of top predictions to return

    Returns:
        dict with keys: predictions, overall_severity, input_symptoms
    """
    _load()

    vec = encode_symptoms(symptom_list).reshape(1, -1)
    proba = _model.predict_proba(vec)[0]
    classes = _encoder.classes_

    # Sort by probability descending
    top_indices = np.argsort(proba)[::-1][:top_n]

    predictions = []
    for idx in top_indices:
        disease_name = classes[idx]
        confidence   = round(float(proba[idx]) * 100, 1)

        profile = DISEASE_PROFILES.get(disease_name, {})
        severity    = profile.get("severity", "Moderate")
        description = profile.get("description", "")
        action      = profile.get("action", "Consult a healthcare professional.")
        icd         = profile.get("icd", "")

        # Build symptom explanation
        matched_core   = [s for s in profile.get("core", []) if s in [x.lower().replace(" ", "_") for x in symptom_list]]
        matched_common = [s for s in profile.get("common", []) if s in [x.lower().replace(" ", "_") for x in symptom_list]]
        matched        = matched_core + matched_common
        matched_display = [s.replace("_", " ").title() for s in matched[:4]]

        explanation = f"{description}"
        if matched_display:
            explanation += f" Your symptoms ({', '.join(matched_display)}) are consistent with this condition."

        predictions.append({
            "disease":          disease_name,
            "confidence":       confidence,
            "severity":         severity,
            "description":      description,
            "explanation":      explanation,
            "suggested_action": action,
            "icd_code":         icd,
            "matched_symptoms": matched_display,
            "related_symptoms": [
                s.replace("_", " ").title()
                for s in (profile.get("core", []) + profile.get("common", []))
                if s not in [x.lower().replace(" ", "_") for x in symptom_list]
            ][:5],
        })

    # Overall severity = worst of top 3
    sev_rank = {"Mild": 1, "Moderate": 2, "Severe": 3, "Critical": 4}
    top_3_sev = [p["severity"] for p in predictions[:3]]
    overall_sev = max(top_3_sev, key=lambda s: sev_rank.get(s, 0))

    return {
        "predictions":       predictions,
        "overall_severity":  overall_sev,
        "input_symptoms":    symptom_list,
        "symptoms_encoded":  int(vec.sum()),
    }
