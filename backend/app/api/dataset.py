import io
import json
import os
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.config import get_settings
from app.db.database import get_db
from app.models.models import Dataset, Student, User
from app.schemas.schemas import DatasetOut, StudentOut

router = APIRouter(prefix="/dataset", tags=["Dataset"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".csv"}


@router.post("/upload", response_model=DatasetOut, status_code=201)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Only CSV files are supported")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}")

    required = {"attendance", "previous_gpa", "study_hours", "assignment_score"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(400, f"CSV missing required columns: {missing}")

    # Persist file
    save_dir = settings.DATA_DIR / "uploads"
    save_dir.mkdir(exist_ok=True)
    safe_name = f"user{current_user.id}_{file.filename}"
    save_path = save_dir / safe_name
    save_path.write_bytes(contents)

    # Save dataset record
    dataset = Dataset(
        name=file.filename,
        filename=str(save_path),
        row_count=len(df),
        col_count=len(df.columns),
        status="uploaded",
        user_id=current_user.id,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Persist student rows
    _save_students(df, dataset.id, db)
    dataset.status = "processed"
    db.commit()
    db.refresh(dataset)

    return dataset


def _save_students(df: pd.DataFrame, dataset_id: int, db: Session):
    db.query(Student).filter(Student.dataset_id == dataset_id).delete()
    records = []
    for _, row in df.iterrows():
        records.append(Student(
            student_id          = str(row.get("student_id", "")),
            age                 = _safe_int(row.get("age")),
            gender              = str(row.get("gender", "")) if "gender" in row else None,
            department          = str(row.get("department", "")) if "department" in row else None,
            attendance          = _safe_float(row.get("attendance")),
            previous_gpa        = _safe_float(row.get("previous_gpa")),
            study_hours         = _safe_float(row.get("study_hours")),
            assignment_score    = _safe_float(row.get("assignment_score")),
            ca_score            = _safe_float(row.get("ca_score")),
            semester_result     = _safe_float(row.get("semester_result")),
            performance_category= str(row.get("performance_category", "")) if "performance_category" in row else None,
            dataset_id          = dataset_id,
        ))
    db.bulk_save_objects(records)
    db.commit()


def _safe_float(val):
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _safe_int(val):
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


@router.get("/", response_model=list[DatasetOut])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Dataset).filter(Dataset.user_id == current_user.id).order_by(Dataset.created_at.desc()).all()


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    return ds


@router.get("/{dataset_id}/students", response_model=list[StudentOut])
def get_dataset_students(
    dataset_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    return db.query(Student).filter(Student.dataset_id == dataset_id).offset(skip).limit(limit).all()


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    # Remove file
    try:
        Path(ds.filename).unlink(missing_ok=True)
    except Exception:
        pass
    db.delete(ds)
    db.commit()
