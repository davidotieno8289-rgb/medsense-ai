"""
app.py — MedSense AI Flask application entry point.

Usage:
    1. pip install -r requirements.txt
    2. python -m ml.train          # Train the ML model (first time only)
    3. python app.py               # Start the development server
"""

import os
import uuid
import logging
from flask import Flask, session, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from database.models import db
from routes.predict  import predict_bp
from routes.history  import history_bp
from routes.symptoms import symptoms_bp

load_dotenv()

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    app = Flask(__name__)

    # ── Config ────────────────────────────────────────────────────────────────
    app.config["SECRET_KEY"]                   = os.getenv("SECRET_KEY", "medsense-dev-secret-change-in-prod")
    app.config["SQLALCHEMY_DATABASE_URI"]       = os.getenv("DATABASE_URL", "sqlite:///medsense.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SESSION_COOKIE_SAMESITE"]        = "Lax"
    app.config["SESSION_COOKIE_SECURE"]          = os.getenv("FLASK_ENV") == "production"

    # ── Extensions ────────────────────────────────────────────────────────────
    db.init_app(app)
    CORS(app, supports_credentials=True, origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ])

    # ── Blueprints ────────────────────────────────────────────────────────────
    app.register_blueprint(predict_bp,  url_prefix="/api")
    app.register_blueprint(history_bp,  url_prefix="/api")
    app.register_blueprint(symptoms_bp, url_prefix="/api")

    # ── DB Init ───────────────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        logger.info("Database tables created.")

    # ── Session Middleware ────────────────────────────────────────────────────
    @app.before_request
    def ensure_session():
        if "session_id" not in session:
            session["session_id"] = str(uuid.uuid4())

    # ── Health Check ──────────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health():
        model_ready = os.path.exists(
            os.path.join(os.path.dirname(__file__), "ml", "saved", "model.pkl")
        )
        return jsonify({
            "status":      "ok",
            "model_ready": model_ready,
            "version":     "1.0.0",
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found."}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error."}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") != "production"
    logger.info(f"🚀 MedSense AI backend running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
