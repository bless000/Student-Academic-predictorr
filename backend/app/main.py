import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dataset, predict, training, analytics
from app.core.config import get_settings
from app.db.database import Base, engine
from app.models import models  # noqa: F401 — registers ORM models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Academic Performance Predictor API",
    description="ML-powered prediction system for student academic outcomes",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(dataset.router)
app.include_router(training.router)
app.include_router(predict.router)
app.include_router(analytics.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Student Predictor API running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
