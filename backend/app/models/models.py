from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    username   = Column(String(80), unique=True, nullable=False, index=True)
    email      = Column(String(120), unique=True, nullable=False, index=True)
    password   = Column(String(255), nullable=False)
    role       = Column(String(20), default="lecturer")   # admin | lecturer | student
    created_at = Column(DateTime(timezone=True), default=now_utc)

    datasets    = relationship("Dataset", back_populates="owner", cascade="all, delete")
    predictions = relationship("Prediction", back_populates="owner", cascade="all, delete")


class Dataset(Base):
    __tablename__ = "datasets"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(200), nullable=False)
    filename    = Column(String(300), nullable=False)
    row_count   = Column(Integer, default=0)
    col_count   = Column(Integer, default=0)
    status      = Column(String(30), default="uploaded")  # uploaded | processed | trained
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), default=now_utc)

    owner    = relationship("User", back_populates="datasets")
    students = relationship("Student", back_populates="dataset", cascade="all, delete")


class Student(Base):
    __tablename__ = "students"

    id                  = Column(Integer, primary_key=True, index=True)
    student_id          = Column(String(20), index=True)
    age                 = Column(Integer, nullable=True)
    gender              = Column(String(10), nullable=True)
    department          = Column(String(100), nullable=True)
    attendance          = Column(Float, nullable=True)
    previous_gpa        = Column(Float, nullable=True)
    study_hours         = Column(Float, nullable=True)
    assignment_score    = Column(Float, nullable=True)
    ca_score            = Column(Float, nullable=True)
    semester_result     = Column(Float, nullable=True)
    performance_category = Column(String(20), nullable=True)
    predicted_performance = Column(String(20), nullable=True)
    dataset_id          = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    created_at          = Column(DateTime(timezone=True), default=now_utc)

    dataset = relationship("Dataset", back_populates="students")


class Prediction(Base):
    __tablename__ = "predictions"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(String(20), nullable=True)
    algorithm   = Column(String(50), nullable=False)
    accuracy    = Column(Float, nullable=True)
    prediction  = Column(String(20), nullable=False)
    confidence  = Column(Float, nullable=True)
    input_data  = Column(Text, nullable=True)   # JSON string
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp   = Column(DateTime(timezone=True), default=now_utc)

    owner = relationship("User", back_populates="predictions")


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id            = Column(Integer, primary_key=True, index=True)
    dataset_id    = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    best_model    = Column(String(50), nullable=True)
    best_accuracy = Column(Float, nullable=True)
    results_json  = Column(Text, nullable=True)   # full JSON metrics
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at    = Column(DateTime(timezone=True), default=now_utc)
