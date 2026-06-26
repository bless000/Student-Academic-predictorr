# 🎓 Student Academic Performance Predictor

> Final Year Project — Crawford University, Ogun State, Nigeria  
> **Predicting Student Academic Performance Using Machine Learning Techniques**

---

## Project Overview

A full-stack web application that uses supervised machine learning to predict student academic performance as **High**, **Medium**, or **Low** — enabling early academic intervention before examinations are completed.

### Algorithms Implemented
| Algorithm | Accuracy | Precision | Recall | F1 Score |
|-----------|----------|-----------|--------|----------|
| **SVM (Best)** | **98.33%** | 98.34% | 98.33% | 98.34% |
| ANN (MLP) | 97.83% | 97.83% | 97.83% | 97.83% |
| Decision Tree | 96.83% | 96.83% | 96.83% | 96.83% |

*Results from 3,000-record synthetic dataset with 80/20 stratified train-test split.*

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Chart.js |
| Backend | Python 3.12 + FastAPI + JWT Auth |
| Database | PostgreSQL + SQLAlchemy ORM |
| ML | Scikit-learn (Decision Tree, SVM, ANN) + Pandas + NumPy |
| Deployment | Frontend → Vercel · Backend → Render · DB → Supabase |

---

## Project Structure

```
student-predictor/
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers (auth, dataset, train, predict, analytics)
│   │   ├── core/          # Config, security (JWT), dependencies
│   │   ├── db/            # SQLAlchemy engine + session
│   │   ├── ml/            # ML pipeline (preprocess, train, predict)
│   │   ├── models/        # ORM models (User, Dataset, Student, Prediction)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   └── main.py        # FastAPI app entrypoint
│   ├── tests/
│   │   └── test_api.py    # 18 tests (unit + integration + acceptance)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios client + service functions
│   │   ├── components/    # Layout (sidebar), UI (ProtectedRoute)
│   │   ├── hooks/         # useAuth context
│   │   ├── pages/         # Login, Dashboard, Upload, Train, Predict, Analytics, Reports, Settings
│   │   └── types/         # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── scripts/
│   └── generate_dataset.py   # Synthetic dataset generator (3,000 records)
├── data/
│   └── students_dataset.csv  # Generated training data
├── models/
│   ├── best_model.pkl        # Serialized best model + encoders
│   └── training_results.json # Algorithm comparison metrics
├── .github/workflows/
│   └── ci-cd.yml             # GitHub Actions CI/CD
└── docker-compose.yml
```

---

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL (or use SQLite for development)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd student-predictor
```

### 2. Generate Dataset & Train Model

```bash
pip install pandas numpy scikit-learn joblib
python scripts/generate_dataset.py

cd backend
pip install -r requirements.txt "pydantic[email]"
python -c "
import sys; sys.path.insert(0,'.')
import pandas as pd
from app.ml.pipeline import train_and_evaluate
df = pd.read_csv('../data/students_dataset.csv')
print(train_and_evaluate(df))
"
```

### 3. Start Backend

```bash
cd backend

# Create .env
cp .env.example .env
# Edit .env: set DATABASE_URL and SECRET_KEY

uvicorn app.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 4. Start Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
# App: http://localhost:5173
```

### 5. Create Admin User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@university.edu","password":"secret123","role":"admin"}'
```

---

## Docker (Full Stack)

```bash
# Copy and configure environment
cp backend/.env.example .env
# Edit .env with your SECRET_KEY

docker-compose up --build
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- Swagger Docs: http://localhost:8000/docs

---

## Running Tests

```bash
cd backend

# Must have trained model first (step 2 above)
python -m pytest tests/test_api.py -v

# Expected: 18 passed
```

### Test Categories
| Type | Count | Description |
|------|-------|-------------|
| Unit | 8 | Health, auth, ML pipeline |
| Integration | 7 | Dataset upload, predict, analytics |
| Acceptance | 3 | Full end-to-end workflow |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login → JWT token |
| GET | `/auth/me` | Current user info |
| POST | `/dataset/upload` | Upload CSV dataset |
| GET | `/dataset/` | List datasets |
| DELETE | `/dataset/{id}` | Delete dataset |
| POST | `/train/{dataset_id}` | Train all 3 models |
| GET | `/train/results/latest` | Get latest training results |
| POST | `/predict/single` | Predict single student |
| POST | `/predict/batch` | Batch predict via CSV upload |
| GET | `/predict/history` | Prediction history |
| GET | `/analytics/` | Full analytics dashboard data |

Full interactive documentation: `http://localhost:8000/docs`

---

## Input Variables (CSV Schema)

| Column | Type | Range | Required |
|--------|------|-------|----------|
| `attendance` | float | 0–100 | ✅ |
| `previous_gpa` | float | 0.0–4.0 | ✅ |
| `study_hours` | float | 0–24 | ✅ |
| `assignment_score` | float | 0–100 | ✅ |
| `ca_score` | float | 0–100 | Optional |
| `semester_result` | float | 0–100 | Optional |
| `age` | int | 15–60 | Optional |
| `gender` | string | Male/Female | Optional |
| `department` | string | — | Optional |
| `student_id` | string | — | Optional |
| `performance_category` | string | High/Medium/Low | Optional (for training) |

---

## Deployment

### Backend → Render

1. Create new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt "pydantic[email]"`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.example`
5. Add `RENDER_DEPLOY_HOOK_URL` to GitHub secrets for auto-deploy

### Frontend → Vercel

1. Import project on [vercel.com](https://vercel.com)
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Database → Supabase PostgreSQL

1. Create project at [supabase.com](https://supabase.com)
2. Copy the **Connection String (URI)** from Settings → Database
3. Set `DATABASE_URL` in your Render environment variables

---

## System Modules

| Module | Status | Description |
|--------|--------|-------------|
| Authentication | ✅ | JWT login/register, role-based (admin/lecturer/student) |
| Dataset Management | ✅ | CSV upload, validation, student record storage |
| Data Preprocessing | ✅ | Missing values, encoding, clipping, feature engineering |
| ML Engine | ✅ | Decision Tree + SVM + ANN training and comparison |
| Prediction Engine | ✅ | Single & batch prediction with confidence scores |
| Analytics Dashboard | ✅ | Charts: performance distribution, department breakdown, model comparison |
| Reports | ✅ | Prediction history with CSV export |

---

## Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Model Accuracy | ≥ 85% | ✅ 98.33% (SVM) |
| Prediction Latency | < 3 seconds | ✅ ~50ms |
| System Uptime | ≥ 90% | ✅ (Render SLA) |
| Test Coverage | All modules | ✅ 18 tests |

---

## Future Improvements (Chapter 5 Scope)

- Real-time prediction via WebSocket
- Mobile application (React Native)
- Integration with university student portal
- Deep learning enhancement (LSTM for time-series GPA)
- Personalised student recommendation engine
- Email alerts for at-risk students

---

## References

- Shahiri, A. M., Husain, W., & Rashid, N. A. (2015). A review on predicting student's performance using data mining techniques.
- Hussain, S. et al. (2019). Student performance prediction system using big data analytics.
- Sarker, I. H. (2021). Machine learning: Algorithms, real-world applications and research directions.
- Alamri, A. et al. (2020). Analysis of student academic performance using learning analytics.

---

*Developed as Final Year Project — B.Sc. Computer Science, Crawford University, Ogun State, Nigeria.*
