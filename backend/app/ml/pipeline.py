"""
ML Pipeline — preprocessing, training, evaluation, model selection.
Algorithms: Decision Tree, SVM, Artificial Neural Network (MLP)
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent.parent.parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

FEATURE_COLS = [
    "attendance",
    "previous_gpa",
    "study_hours",
    "assignment_score",
    "ca_score",
    "age",
    "semester_result",
    "department_encoded",
    "gender_encoded",
]
TARGET_COL = "performance_category"


# ─── Preprocessing ────────────────────────────────────────────────────────────

def preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, LabelEncoder, LabelEncoder, LabelEncoder]:
    """
    Returns (processed_df, dept_encoder, gender_encoder, target_encoder)
    Handles missing values, encoding, and feature engineering.
    """
    df = df.copy()

    # Fill missing numerics with median
    numeric_cols = ["attendance", "previous_gpa", "study_hours",
                    "assignment_score", "ca_score", "age", "semester_result"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            df[col] = df[col].fillna(df[col].median())
            # Clip to valid ranges
    df["attendance"]       = df["attendance"].clip(0, 100)
    df["previous_gpa"]     = df["previous_gpa"].clip(0, 4.0)
    df["study_hours"]      = df["study_hours"].clip(0, 24)
    df["assignment_score"] = df["assignment_score"].clip(0, 100)
    df["ca_score"]         = df["ca_score"].clip(0, 100)
    df["semester_result"]  = df["semester_result"].clip(0, 100)
    df["age"]              = df["age"].clip(15, 60)

    # Encode categoricals
    dept_enc   = LabelEncoder()
    gender_enc = LabelEncoder()
    target_enc = LabelEncoder()

    if "department" in df.columns:
        df["department"] = df["department"].fillna("Unknown")
        df["department_encoded"] = dept_enc.fit_transform(df["department"].astype(str))
    else:
        df["department_encoded"] = 0
        dept_enc.fit(["Unknown"])

    if "gender" in df.columns:
        df["gender"] = df["gender"].fillna("Unknown")
        df["gender_encoded"] = gender_enc.fit_transform(df["gender"].astype(str))
    else:
        df["gender_encoded"] = 0
        gender_enc.fit(["Unknown"])

    if TARGET_COL in df.columns:
        df[TARGET_COL] = df[TARGET_COL].fillna("Medium")
        df["target_encoded"] = target_enc.fit_transform(df[TARGET_COL])
    else:
        target_enc.fit(["High", "Low", "Medium"])

    return df, dept_enc, gender_enc, target_enc


# ─── Model Definitions ────────────────────────────────────────────────────────

def build_models() -> dict[str, Any]:
    return {
        "Decision Tree": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", DecisionTreeClassifier(
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=42,
            )),
        ]),
        "SVM": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", SVC(
                kernel="rbf",
                C=1.0,
                gamma="scale",
                class_weight="balanced",
                probability=True,
                random_state=42,
            )),
        ]),
        "ANN": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", MLPClassifier(
                hidden_layer_sizes=(128, 64, 32),
                activation="relu",
                solver="adam",
                max_iter=500,
                early_stopping=True,
                validation_fraction=0.1,
                random_state=42,
                learning_rate_init=0.001,
            )),
        ]),
    }


# ─── Training & Evaluation ────────────────────────────────────────────────────

def train_and_evaluate(df: pd.DataFrame) -> dict:
    """
    Full training pipeline. Returns a dict with results per model + best model info.
    """
    df, dept_enc, gender_enc, target_enc = preprocess(df)

    # Ensure all feature columns exist
    missing = [c for c in FEATURE_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing feature columns after preprocessing: {missing}")

    X = df[FEATURE_COLS].values
    y = df["target_encoded"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models = build_models()
    results: dict[str, dict] = {}

    for name, pipe in models.items():
        logger.info(f"Training {name}…")
        pipe.fit(X_train, y_train)
        y_pred = pipe.predict(X_test)

        acc  = round(accuracy_score(y_test, y_pred) * 100, 2)
        prec = round(precision_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        rec  = round(recall_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        f1   = round(f1_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        cm   = confusion_matrix(y_test, y_pred).tolist()
        cr   = classification_report(y_test, y_pred,
                                     target_names=target_enc.classes_,
                                     output_dict=True, zero_division=0)

        results[name] = {
            "accuracy":    acc,
            "precision":   prec,
            "recall":      rec,
            "f1_score":    f1,
            "confusion_matrix": cm,
            "class_report": cr,
            "pipeline":    pipe,
        }
        logger.info(f"  {name}: acc={acc}%, f1={f1}%")

    # Select best model by accuracy
    best_name = max(results, key=lambda k: results[k]["accuracy"])
    best_pipe  = results[best_name]["pipeline"]

    # Persist best model + encoders
    artefacts = {
        "model":        best_pipe,
        "dept_enc":     dept_enc,
        "gender_enc":   gender_enc,
        "target_enc":   target_enc,
        "feature_cols": FEATURE_COLS,
        "best_model":   best_name,
    }
    joblib.dump(artefacts, MODEL_DIR / "best_model.pkl")

    # Persist comparison summary (JSON-safe)
    summary = {
        name: {k: v for k, v in info.items() if k != "pipeline"}
        for name, info in results.items()
    }
    summary["best_model"] = best_name
    with open(MODEL_DIR / "training_results.json", "w") as f:
        json.dump(summary, f, indent=2)

    logger.info(f"Best model: {best_name} ({results[best_name]['accuracy']}% accuracy)")

    return {
        "results":    summary,
        "best_model": best_name,
        "best_accuracy": results[best_name]["accuracy"],
    }


# ─── Prediction ───────────────────────────────────────────────────────────────

def load_model() -> dict:
    model_path = MODEL_DIR / "best_model.pkl"
    if not model_path.exists():
        raise FileNotFoundError("No trained model found. Please train first.")
    return joblib.load(model_path)


def predict_single(student_data: dict) -> dict:
    """
    Predict for a single student dict.
    Returns: {prediction, confidence, recommendation}
    """
    artefacts = load_model()
    model      = artefacts["model"]
    dept_enc   = artefacts["dept_enc"]
    gender_enc = artefacts["gender_enc"]
    target_enc = artefacts["target_enc"]

    # Safe encoding for unseen labels
    def safe_encode(enc: LabelEncoder, val: str) -> int:
        try:
            return int(enc.transform([val])[0])
        except ValueError:
            return 0

    dept_code   = safe_encode(dept_enc,   str(student_data.get("department", "Unknown")))
    gender_code = safe_encode(gender_enc, str(student_data.get("gender", "Unknown")))

    row = np.array([[
        float(student_data.get("attendance",       70)),
        float(student_data.get("previous_gpa",     2.5)),
        float(student_data.get("study_hours",      5)),
        float(student_data.get("assignment_score", 60)),
        float(student_data.get("ca_score",         60)),
        float(student_data.get("age",              20)),
        float(student_data.get("semester_result",  55)),
        dept_code,
        gender_code,
    ]])

    pred_idx  = model.predict(row)[0]
    pred_label = target_enc.inverse_transform([pred_idx])[0]

    # Probability / confidence
    if hasattr(model, "predict_proba"):
        proba      = model.predict_proba(row)[0]
        confidence = round(float(np.max(proba)) * 100, 1)
    else:
        confidence = None

    recommendations = {
        "High":   "Student is on track. Continue current study habits and maintain attendance.",
        "Medium": "Additional academic support recommended. Focus on improving assignment scores and study hours.",
        "Low":    "Urgent intervention required. Please schedule counselling and academic support sessions immediately.",
    }

    return {
        "prediction":     pred_label,
        "confidence":     confidence,
        "recommendation": recommendations.get(pred_label, ""),
    }


def predict_batch(df: pd.DataFrame) -> pd.DataFrame:
    """Predict for a dataframe of students."""
    artefacts  = load_model()
    model      = artefacts["model"]
    dept_enc   = artefacts["dept_enc"]
    gender_enc = artefacts["gender_enc"]
    target_enc = artefacts["target_enc"]

    df2 = df.copy()

    def safe_enc(enc, col):
        known = set(enc.classes_)
        return df2[col].apply(lambda v: enc.transform([v])[0] if str(v) in known else 0)

    if "department" in df2.columns:
        df2["department_encoded"] = safe_enc(dept_enc, "department")
    else:
        df2["department_encoded"] = 0

    if "gender" in df2.columns:
        df2["gender_encoded"] = safe_enc(gender_enc, "gender")
    else:
        df2["gender_encoded"] = 0

    numeric = ["attendance", "previous_gpa", "study_hours",
               "assignment_score", "ca_score", "age", "semester_result"]
    for col in numeric:
        if col not in df2.columns:
            df2[col] = 0
        df2[col] = pd.to_numeric(df2[col], errors="coerce").fillna(0)

    X = df2[FEATURE_COLS].values
    preds = model.predict(X)
    df2["predicted_performance"] = target_enc.inverse_transform(preds)
    return df2
