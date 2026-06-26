import json
from collections import defaultdict
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.models import Prediction, Student, User
from app.schemas.schemas import AnalyticsOut

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/", response_model=AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    students    = db.query(Student).all()
    predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()

    # Performance distribution
    perf_dist: dict[str, int] = defaultdict(int)
    for s in students:
        cat = s.performance_category or s.predicted_performance or "Unknown"
        perf_dist[cat] += 1

    # Department breakdown
    dept_breakdown: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for s in students:
        dept = s.department or "Unknown"
        cat  = s.performance_category or s.predicted_performance or "Unknown"
        dept_breakdown[dept][cat] += 1

    # Model comparison from last training
    model_comparison = None
    results_file = Path(__file__).resolve().parent.parent.parent.parent.parent / "models" / "training_results.json"
    if results_file.exists():
        data = json.loads(results_file.read_text())
        model_comparison = {k: v for k, v in data.items() if k != "best_model"}

    recent_acc = None
    if predictions:
        accs = [p.accuracy for p in predictions if p.accuracy is not None]
        if accs:
            recent_acc = round(sum(accs) / len(accs), 2)

    return AnalyticsOut(
        total_students        = len(students),
        total_predictions     = len(predictions),
        performance_distribution = dict(perf_dist),
        department_breakdown  = {k: dict(v) for k, v in dept_breakdown.items()},
        model_comparison      = model_comparison,
        recent_accuracy       = recent_acc,
    )


@router.get("/students")
def list_all_students(
    skip: int = 0,
    limit: int = 100,
    department: str = None,
    performance: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Student)
    if department:
        q = q.filter(Student.department == department)
    if performance:
        q = q.filter(
            (Student.performance_category == performance) |
            (Student.predicted_performance == performance)
        )
    total = q.count()
    students = q.offset(skip).limit(limit).all()
    return {"total": total, "students": students}
