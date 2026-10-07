# MedSense AI

MedSense AI is a full-stack symptom analysis application that predicts likely conditions from user-selected symptoms, explains confidence/severity, stores session history, and offers a health assistant chat experience.

> ⚠️ **Medical notice:** This project is for informational use only and is **not** a substitute for professional medical advice, diagnosis, or treatment.

## Project Overview

The repository contains:
- A **Flask backend** for ML inference, symptom metadata, history, feedback, and chat proxy APIs.
- A **React + Vite frontend** for symptom selection, visualized predictions, multilingual UI (English/Swahili), hospitals view, and chat UI.
- A **Python ML pipeline** that trains an ensemble model from synthetic disease/symptom profiles.

## Key Features

Grounded in the current implementation:
- Symptom lookup and filtering (`GET /api/symptoms`)
- Smart related symptom suggestions (`POST /api/suggestions`)
- Disease prediction with top results, severity, confidence, explanation, related symptoms, and ICD code (`POST /api/predict`)
- Session-based prediction history (list, item, clear)
- User feedback capture for predictions (`POST /api/feedback`)
- Basic session stats (`GET /api/stats`)
- Backend health check (`GET /api/health`)
- AI chat proxy to Anthropic (`POST /api/chat`) with frontend fallback to local rule-based knowledge when unavailable
- Frontend data visualizations with Recharts and bilingual labels (EN/SW)

## Technology Stack

### Backend
- Python 3
- Flask, Flask-CORS, Flask-SQLAlchemy
- scikit-learn, NumPy, pandas, joblib
- SQLite (default)

### Frontend
- React 18 + Vite
- Axios
- Recharts
- CSS

## Prerequisites

Install locally:
- **Python 3.10+** (recommended)
- **Node.js 18+** and npm

## Installation & Setup

### 1) Clone and enter repository

```bash
git clone https://github.com/davidotieno8289-rgb/medsense-ai.git
cd medsense-ai
```

### 2) Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows (PowerShell): .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
```

### 3) Frontend setup

In a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

## Environment Variables

### Backend (`backend/.env`)

From `backend/.env.example`:

```env
FLASK_ENV=development
SECRET_KEY=change-this-to-a-random-secret-key
PORT=5000
DATABASE_URL=sqlite:///medsense.db
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Notes:
- `ANTHROPIC_API_KEY` is required only for live `/api/chat` calls.
- Without it, frontend chat falls back to its built-in local knowledge responses.

### Frontend (`frontend/.env`)

No variable is required for local development because Vite proxies `/api` to `http://localhost:5000`.

Optional for production:

```env
VITE_API_BASE_URL=https://your-backend.com
```

## Running the Application

### 1) (Optional) Retrain the model

If model artifacts are missing or you want to retrain:

```bash
cd backend
python -m ml.train
```

This generates artifacts under `backend/ml/saved/`.

### 2) Start backend

```bash
cd backend
python app.py
```

Backend runs on `http://localhost:5000` by default.

### 3) Start frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Usage Example

### API: Predict disease from symptoms

Request:

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms":["fever","headache","fatigue"]}'
```

Response shape (abbreviated):

```json
{
  "predictions": [
    {
      "disease": "Malaria",
      "confidence": 72.3,
      "severity": "Severe",
      "description": "...",
      "explanation": "...",
      "suggested_action": "...",
      "icd_code": "B50-B54",
      "matched_symptoms": ["Fever", "Headache"],
      "related_symptoms": ["Chills", "Body Aches"]
    }
  ],
  "overall_severity": "Severe",
  "input_symptoms": ["fever", "headache", "fatigue"],
  "symptoms_encoded": 3,
  "history_id": 12,
  "disclaimer": "⚠ This tool is for informational purposes only..."
}
```

## API Endpoints

Base URL: `/api`

- `GET /health` — service health + model readiness
- `GET /symptoms?q=<query>` — list/search supported symptoms
- `GET /diseases` — list disease profiles exposed to clients
- `POST /suggestions` — suggestions based on selected symptoms
- `POST /predict` — top disease predictions
- `GET /history?limit=20` — session prediction history
- `GET /history/<id>` — single history record
- `DELETE /history` — clear session history
- `POST /feedback` — mark prediction as correct/wrong/unsure
- `GET /stats` — simple feedback accuracy summary
- `POST /chat` — proxy to Anthropic Messages API

## Model Behavior

The backend model is trained from synthetic samples generated from disease symptom profiles in `backend/ml/dataset.py`.

Current training approach (`backend/ml/train.py`):
- Ensemble VotingClassifier (soft voting):
  - RandomForestClassifier
  - GaussianNB
  - DecisionTreeClassifier
- Default `top_n=5` predictions in inference

## Project Structure

```text
medsense-ai/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── database/
│   │   └── models.py
│   ├── ml/
│   │   ├── dataset.py
│   │   ├── predictor.py
│   │   ├── train.py
│   │   └── saved/
│   └── routes/
│       ├── predict.py
│       ├── history.py
│       └── symptoms.py
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── vite.config.js
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── App.jsx
│       └── main.jsx
└── disease_prediction_ai.jsx
```

## Testing, Linting, and Build

This repository currently exposes frontend scripts only:

```bash
cd frontend
npm run lint
npm run build
npm run preview
```

Backend test commands are not currently defined in the repository.

## Limitations & Responsible Use

- Predictions are generated from a synthetic training process and may not reflect real-world clinical performance.
- The system is **not** a medical device and is not validated for diagnosis.
- Chat quality depends on API availability/configuration; offline fallback responses are rule-based.
- Hospital listings in the UI are static entries (Nairobi-focused in current code).
- Always consult qualified healthcare professionals for medical decisions.

## Contributing

Contributions are welcome. A practical flow:
1. Fork the repository
2. Create a feature branch
3. Make focused changes
4. Run available frontend checks (`npm run lint`, `npm run build`)
5. Open a pull request with a clear description

## License

No license file is currently present in this repository. If you plan to reuse or distribute this project, add or confirm licensing with the repository owner.
