"""
train.py — Train and save the MedSense AI disease prediction model.
Run this script once before starting the Flask server:
    python -m ml.train
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder

from ml.dataset import DISEASE_PROFILES, ALL_SYMPTOMS

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved")
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
SYMPTOMS_PATH = os.path.join(MODEL_DIR, "symptoms.json")

RANDOM_STATE = 42
SAMPLES_PER_DISEASE = 120   # synthetic samples per disease


def generate_dataset() -> pd.DataFrame:
    """Generate synthetic training data from disease profiles."""
    np.random.seed(RANDOM_STATE)
    rows = []

    for disease, profile in DISEASE_PROFILES.items():
        core    = profile["core"]
        common  = profile.get("common", [])
        rare    = profile.get("rare", [])

        for _ in range(SAMPLES_PER_DISEASE):
            row = {s: 0 for s in ALL_SYMPTOMS}

            # Core symptoms: always present (95% probability)
            for s in core:
                if s in row and np.random.rand() > 0.05:
                    row[s] = 1

            # Common symptoms: often present (70%)
            for s in common:
                if s in row and np.random.rand() > 0.30:
                    row[s] = 1

            # Rare symptoms: sometimes present (20%)
            for s in rare:
                if s in row and np.random.rand() > 0.80:
                    row[s] = 1

            # Random noise: 5% chance any other symptom is set
            for s in ALL_SYMPTOMS:
                if row[s] == 0 and np.random.rand() < 0.05:
                    row[s] = 1

            row["disease"] = disease
            rows.append(row)

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)
    return df


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("⚙  Generating synthetic training dataset...")
    df = generate_dataset()
    print(f"   {len(df)} samples across {df['disease'].nunique()} diseases")

    X = df[ALL_SYMPTOMS].values
    y = df["disease"].values

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.20, stratify=y_enc, random_state=RANDOM_STATE
    )

    # Ensemble: Random Forest + Naive Bayes + Decision Tree
    rf  = RandomForestClassifier(n_estimators=200, max_depth=None, random_state=RANDOM_STATE)
    nb  = GaussianNB()
    dt  = DecisionTreeClassifier(max_depth=12, random_state=RANDOM_STATE)

    ensemble = VotingClassifier(
        estimators=[("rf", rf), ("nb", nb), ("dt", dt)],
        voting="soft",
        weights=[3, 1, 1],
    )

    print("🧠  Training ensemble model (Random Forest + Naive Bayes + Decision Tree)...")
    ensemble.fit(X_train, y_train)

    y_pred = ensemble.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n✅  Test Accuracy: {acc*100:.1f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Save artifacts
    joblib.dump(ensemble, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    with open(SYMPTOMS_PATH, "w") as f:
        json.dump(ALL_SYMPTOMS, f)

    print(f"\n💾  Model saved → {MODEL_PATH}")
    print(f"💾  Encoder saved → {ENCODER_PATH}")
    print(f"💾  Symptoms saved → {SYMPTOMS_PATH}")
    return acc


if __name__ == "__main__":
    train()
