"""
Synthetic student dataset generator — 3,000 records
"""
import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 3000

departments = ["Computer Science", "Engineering", "Business Admin",
               "Medicine", "Law", "Education", "Accounting", "Economics"]
genders = ["Male", "Female"]

# Generate with controlled distribution for balanced classes
records = []
targets = ["High"] * 900 + ["Medium"] * 1350 + ["Low"] * 750
np.random.shuffle(targets)

for i, cat in enumerate(targets):
    if cat == "High":
        att  = np.clip(np.random.normal(88, 8), 60, 100)
        gpa  = np.clip(np.random.normal(3.6, 0.3), 2.5, 4.0)
        hrs  = np.clip(np.random.normal(9, 2), 4, 20)
        asn  = np.clip(np.random.normal(82, 8), 55, 100)
        ca   = np.clip(np.random.normal(80, 8), 55, 100)
        sem  = np.clip(np.random.normal(78, 8), 55, 100)
    elif cat == "Medium":
        att  = np.clip(np.random.normal(72, 10), 40, 95)
        gpa  = np.clip(np.random.normal(2.8, 0.4), 1.5, 3.5)
        hrs  = np.clip(np.random.normal(5, 2), 1, 12)
        asn  = np.clip(np.random.normal(62, 10), 35, 85)
        ca   = np.clip(np.random.normal(60, 10), 35, 85)
        sem  = np.clip(np.random.normal(58, 10), 35, 85)
    else:  # Low
        att  = np.clip(np.random.normal(52, 12), 0, 75)
        gpa  = np.clip(np.random.normal(1.9, 0.5), 0, 2.5)
        hrs  = np.clip(np.random.normal(2, 1.5), 0, 6)
        asn  = np.clip(np.random.normal(40, 12), 0, 65)
        ca   = np.clip(np.random.normal(38, 12), 0, 65)
        sem  = np.clip(np.random.normal(38, 12), 0, 65)

    records.append({
        "student_id":       f"ST{str(i+1).zfill(4)}",
        "age":              int(np.random.randint(17, 30)),
        "gender":           np.random.choice(genders, p=[0.52, 0.48]),
        "department":       np.random.choice(departments),
        "attendance":       round(float(att), 1),
        "previous_gpa":     round(float(gpa), 2),
        "study_hours":      round(float(hrs), 1),
        "assignment_score": round(float(asn), 1),
        "ca_score":         round(float(ca), 1),
        "semester_result":  round(float(sem), 1),
        "performance_category": cat,
    })

df = pd.DataFrame(records)
out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "students_dataset.csv")
df.to_csv(out_path, index=False)
print(f"Saved {len(df)} records → {out_path}")
print(df["performance_category"].value_counts())
