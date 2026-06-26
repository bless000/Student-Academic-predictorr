import json
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.ml.pipeline import train_and_evaluate
from app.models.models import Dataset, TrainingRun, User
from app.schemas.schemas import TrainingResultOut

router = APIRouter(prefix="/train", tags=["Training"])


@router.post("/{dataset_id}", response_model=TrainingResultOut)
def train_model(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")

    try:
        df = pd.read_csv(ds.filename)
    except Exception as e:
        raise HTTPException(400, f"Could not read dataset file: {e}")

    try:
        result = train_and_evaluate(df)
    except Exception as e:
        raise HTTPException(500, f"Training failed: {e}")

    # Persist training run
    run = TrainingRun(
        dataset_id    = dataset_id,
        best_model    = result["best_model"],
        best_accuracy = result["best_accuracy"],
        results_json  = json.dumps(result["results"]),
        user_id       = current_user.id,
    )
    db.add(run)
    ds.status = "trained"
    db.commit()

    return result


@router.get("/results/latest", response_model=TrainingResultOut)
def latest_training_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = (
        db.query(TrainingRun)
        .filter(TrainingRun.user_id == current_user.id)
        .order_by(TrainingRun.created_at.desc())
        .first()
    )
    if not run:
        # Try reading from file
        results_file = Path(__file__).resolve().parent.parent.parent.parent.parent / "models" / "training_results.json"
        if results_file.exists():
            data = json.loads(results_file.read_text())
            best = data.get("best_model", "SVM")
            return {
                "best_model":    best,
                "best_accuracy": data.get(best, {}).get("accuracy", 0),
                "results":       data,
            }
        raise HTTPException(404, "No training results found. Please train a model first.")

    results = json.loads(run.results_json)
    return {
        "best_model":    run.best_model,
        "best_accuracy": run.best_accuracy,
        "results":       results,
    }
