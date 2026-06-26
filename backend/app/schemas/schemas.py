from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field("lecturer", pattern="^(admin|lecturer|student)$")


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Dataset ──────────────────────────────────────────────────────────────────

class DatasetOut(BaseModel):
    id: int
    name: str
    filename: str
    row_count: int
    col_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Student ──────────────────────────────────────────────────────────────────

class StudentOut(BaseModel):
    id: int
    student_id: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    department: Optional[str]
    attendance: Optional[float]
    previous_gpa: Optional[float]
    study_hours: Optional[float]
    assignment_score: Optional[float]
    ca_score: Optional[float]
    semester_result: Optional[float]
    performance_category: Optional[str]
    predicted_performance: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Prediction ───────────────────────────────────────────────────────────────

class PredictSingleIn(BaseModel):
    student_id: Optional[str] = None
    age: float = Field(20, ge=15, le=60)
    gender: str = "Male"
    department: str = "Computer Science"
    attendance: float = Field(..., ge=0, le=100)
    previous_gpa: float = Field(..., ge=0, le=4.0)
    study_hours: float = Field(..., ge=0, le=24)
    assignment_score: float = Field(..., ge=0, le=100)
    ca_score: float = Field(..., ge=0, le=100)
    semester_result: float = Field(..., ge=0, le=100)


class PredictionOut(BaseModel):
    id: int
    student_id: Optional[str]
    algorithm: str
    accuracy: Optional[float]
    prediction: str
    confidence: Optional[float]
    timestamp: datetime

    model_config = {"from_attributes": True}


# ─── Training ─────────────────────────────────────────────────────────────────

class TrainingResultOut(BaseModel):
    best_model: str
    best_accuracy: float
    results: Dict[str, Any]


# ─── Analytics ────────────────────────────────────────────────────────────────

class AnalyticsOut(BaseModel):
    total_students: int
    total_predictions: int
    performance_distribution: Dict[str, int]
    department_breakdown: Dict[str, Dict[str, int]]
    model_comparison: Optional[Dict[str, Any]]
    recent_accuracy: Optional[float]
