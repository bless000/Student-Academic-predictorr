import io
import json
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.ml.pipeline import load_model, predict_batch, predict_single
from app.models.models import Prediction, TrainingRun, User
from app.schemas.schemas import PredictSingleIn, PredictionOut

router = APIRouter(prefix="/predict", tags=["Prediction"])


def _get_best_model_name() -> str:
    """Get best model name from disk or default."""
    results_file = Path(__file__).resolve().parent.parent.parent.parent.parent / "models" / "training_results.json"
    if results_file.exists():
        data = json.loads(results_file.read_text())
        return data.get("best_model", "SVM")
    return "SVM"


def _get_best_accuracy() -> float:
    results_file = Path(__file__).resolve().parent.parent.parent.parent.parent / "models" / "training_results.json"
    if results_file.exists():
        data = json.loads(results_file.read_text())
        best = data.get("best_model", "SVM")
        return data.get(best, {}).get("accuracy", 0.0)
    return 0.0


@router.post("/single", response_model=PredictionOut)
def predict_student(
    payload: PredictSingleIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = predict_single(payload.model_dump())
    except FileNotFoundError:
        raise HTTPException(400, "No trained model found. Please train a model first.")
    except Exception as e:
        raise HTTPException(500, f"Prediction failed: {e}")

    best_model = _get_best_model_name()
    best_acc   = _get_best_accuracy()

    pred = Prediction(
        student_id  = payload.student_id,
        algorithm   = best_model,
        accuracy    = best_acc,
        prediction  = result["prediction"],
        confidence  = result.get("confidence"),
        input_data  = json.dumps(payload.model_dump()),
        user_id     = current_user.id,
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred


@router.post("/batch")
async def predict_batch_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV, get predictions for all rows, return CSV download."""
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}")

    try:
        result_df = predict_batch(df)
    except FileNotFoundError:
        raise HTTPException(400, "No trained model. Please train first.")
    except Exception as e:
        raise HTTPException(500, f"Batch prediction failed: {e}")

    output = io.StringIO()
    result_df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=predictions_{file.filename}"},
    )


@router.get("/history", response_model=list[PredictionOut])
def prediction_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/history/{pred_id}", response_model=PredictionOut)
def get_prediction(
    pred_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pred = db.query(Prediction).filter(
        Prediction.id == pred_id,
        Prediction.user_id == current_user.id
    ).first()
    if not pred:
        raise HTTPException(404, "Prediction not found")
    return pred
