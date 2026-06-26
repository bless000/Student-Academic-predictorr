"""
Full test suite: unit tests for ML pipeline + API integration tests.
Run with:  cd backend && pytest tests/ -v
"""
import json
import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ── Setup in-memory SQLite for tests ─────────────────────────────────────────
TEST_DB_URL = "sqlite:///./test.db"
from app.db.database import Base, get_db
from app.main import app

engine_test = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)
Base.metadata.create_all(bind=engine_test)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_token():
    # Register
    client.post("/auth/register", json={
        "username": "testadmin",
        "email": "admin@test.com",
        "password": "secret123",
        "role": "admin",
    })
    resp = client.post("/auth/login", json={"username": "testadmin", "password": "secret123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def sample_csv_bytes():
    df = pd.DataFrame({
        "student_id":       ["ST001", "ST002", "ST003"],
        "age":              [20, 21, 19],
        "gender":           ["Male", "Female", "Male"],
        "department":       ["Computer Science", "Engineering", "Law"],
        "attendance":       [85.0, 60.0, 45.0],
        "previous_gpa":     [3.5, 2.5, 1.8],
        "study_hours":      [8.0, 4.0, 2.0],
        "assignment_score": [80.0, 55.0, 40.0],
        "ca_score":         [78.0, 52.0, 38.0],
        "semester_result":  [75.0, 50.0, 35.0],
        "performance_category": ["High", "Medium", "Low"],
    })
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return buf.getvalue()


# ─── Unit: Health ─────────────────────────────────────────────────────────────

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


# ─── Unit: Auth ───────────────────────────────────────────────────────────────

def test_register_duplicate():
    client.post("/auth/register", json={
        "username": "dupuser", "email": "dup@test.com",
        "password": "pass123", "role": "lecturer"
    })
    r = client.post("/auth/register", json={
        "username": "dupuser", "email": "dup@test.com",
        "password": "pass123", "role": "lecturer"
    })
    assert r.status_code == 400


def test_login_wrong_password():
    client.post("/auth/register", json={
        "username": "badpass", "email": "badpass@test.com",
        "password": "correct123", "role": "lecturer"
    })
    r = client.post("/auth/login", json={"username": "badpass", "password": "wrong"})
    assert r.status_code == 401


def test_me_endpoint(auth_headers):
    r = client.get("/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["username"] == "testadmin"


# ─── Integration: Dataset ─────────────────────────────────────────────────────

def test_upload_dataset(auth_headers, sample_csv_bytes):
    r = client.post(
        "/dataset/upload",
        files={"file": ("students.csv", sample_csv_bytes, "text/csv")},
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["row_count"] == 3
    assert data["status"] in ("uploaded", "processed")


def test_list_datasets(auth_headers):
    r = client.get("/dataset/", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


def test_upload_invalid_file(auth_headers):
    r = client.post(
        "/dataset/upload",
        files={"file": ("test.txt", b"not a csv", "text/plain")},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_upload_missing_columns(auth_headers):
    bad_csv = b"name,score\nAlice,80\n"
    r = client.post(
        "/dataset/upload",
        files={"file": ("bad.csv", bad_csv, "text/csv")},
        headers=auth_headers,
    )
    assert r.status_code == 400


# ─── Integration: Prediction (uses pre-trained model) ─────────────────────────

def test_predict_single(auth_headers):
    payload = {
        "student_id": "ST999",
        "age": 20,
        "gender": "Male",
        "department": "Computer Science",
        "attendance": 85.0,
        "previous_gpa": 3.5,
        "study_hours": 8.0,
        "assignment_score": 80.0,
        "ca_score": 78.0,
        "semester_result": 75.0,
    }
    r = client.post("/predict/single", json=payload, headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["prediction"] in ("High", "Medium", "Low")
    assert "confidence" in data


def test_predict_low_performer(auth_headers):
    payload = {
        "age": 20, "gender": "Female", "department": "Law",
        "attendance": 30.0, "previous_gpa": 1.2,
        "study_hours": 1.0, "assignment_score": 25.0,
        "ca_score": 20.0, "semester_result": 22.0,
    }
    r = client.post("/predict/single", json=payload, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["prediction"] == "Low"


def test_predict_batch(auth_headers, sample_csv_bytes):
    r = client.post(
        "/predict/batch",
        files={"file": ("students.csv", sample_csv_bytes, "text/csv")},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert "predicted_performance" in r.text


def test_prediction_history(auth_headers):
    r = client.get("/predict/history", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ─── Integration: Analytics ───────────────────────────────────────────────────

def test_analytics(auth_headers):
    r = client.get("/analytics/", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_students" in data
    assert "performance_distribution" in data


# ─── Unit: ML Pipeline ────────────────────────────────────────────────────────

def test_pipeline_predict_single():
    from app.ml.pipeline import predict_single
    result = predict_single({
        "attendance": 90, "previous_gpa": 3.8, "study_hours": 10,
        "assignment_score": 85, "ca_score": 82, "age": 21,
        "semester_result": 80, "department": "Computer Science", "gender": "Male",
    })
    assert result["prediction"] in ("High", "Medium", "Low")
    assert result["confidence"] is not None
    assert result["recommendation"]


def test_pipeline_predict_batch():
    from app.ml.pipeline import predict_batch
    df = pd.DataFrame([{
        "attendance": 75, "previous_gpa": 2.8, "study_hours": 5,
        "assignment_score": 60, "ca_score": 58, "age": 20,
        "semester_result": 55, "department": "Engineering", "gender": "Female",
    }])
    result_df = predict_batch(df)
    assert "predicted_performance" in result_df.columns
    assert result_df["predicted_performance"].iloc[0] in ("High", "Medium", "Low")


def test_pipeline_invalid_inputs():
    from app.ml.pipeline import predict_single
    # Should not raise — missing fields use defaults
    result = predict_single({})
    assert result["prediction"] in ("High", "Medium", "Low")


# ─── Acceptance: end-to-end flow ─────────────────────────────────────────────

def test_full_workflow(auth_headers, sample_csv_bytes):
    """
    Acceptance test: Upload → List → Predict → History
    """
    # 1. Upload
    up = client.post(
        "/dataset/upload",
        files={"file": ("e2e.csv", sample_csv_bytes, "text/csv")},
        headers=auth_headers,
    )
    assert up.status_code == 201

    # 2. List datasets
    lst = client.get("/dataset/", headers=auth_headers)
    assert len(lst.json()) >= 1

    # 3. Predict
    pred = client.post("/predict/single", headers=auth_headers, json={
        "age": 22, "gender": "Male", "department": "Computer Science",
        "attendance": 88.0, "previous_gpa": 3.6,
        "study_hours": 9.0, "assignment_score": 82.0,
        "ca_score": 80.0, "semester_result": 77.0,
    })
    assert pred.status_code == 200

    # 4. Verify history
    hist = client.get("/predict/history", headers=auth_headers)
    assert len(hist.json()) >= 1

    # 5. Analytics
    ana = client.get("/analytics/", headers=auth_headers)
    assert ana.json()["total_predictions"] >= 1
