"""
database/models.py — SQLAlchemy models for MedSense AI.
"""

import json
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class PredictionHistory(db.Model):
    __tablename__ = "prediction_history"

    id              = db.Column(db.Integer, primary_key=True)
    session_id      = db.Column(db.String(64), nullable=False, index=True)
    symptoms        = db.Column(db.Text, nullable=False)   # JSON list
    top_disease     = db.Column(db.String(120))
    overall_severity = db.Column(db.String(20))
    confidence      = db.Column(db.Float)
    full_result     = db.Column(db.Text)                   # Full JSON result
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    feedback        = db.Column(db.String(20), nullable=True)  # correct | wrong | unsure

    def to_dict(self):
        return {
            "id":               self.id,
            "session_id":       self.session_id,
            "symptoms":         json.loads(self.symptoms),
            "top_disease":      self.top_disease,
            "overall_severity": self.overall_severity,
            "confidence":       self.confidence,
            "full_result":      json.loads(self.full_result) if self.full_result else None,
            "created_at":       self.created_at.isoformat(),
            "feedback":         self.feedback,
        }


class Feedback(db.Model):
    __tablename__ = "feedback"

    id             = db.Column(db.Integer, primary_key=True)
    history_id     = db.Column(db.Integer, db.ForeignKey("prediction_history.id"))
    actual_disease = db.Column(db.String(120))
    rating         = db.Column(db.String(20))   # correct | wrong | unsure
    notes          = db.Column(db.Text)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":             self.id,
            "history_id":     self.history_id,
            "actual_disease": self.actual_disease,
            "rating":         self.rating,
            "notes":          self.notes,
            "created_at":     self.created_at.isoformat(),
        }
