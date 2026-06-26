export interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

export interface Dataset {
  id: number
  name: string
  filename: string
  row_count: number
  col_count: number
  status: string
  created_at: string
}

export interface Student {
  id: number
  student_id?: string
  age?: number
  gender?: string
  department?: string
  attendance?: number
  previous_gpa?: number
  study_hours?: number
  assignment_score?: number
  ca_score?: number
  semester_result?: number
  performance_category?: string
  predicted_performance?: string
  created_at: string
}

export interface PredictInput {
  student_id?: string
  age: number
  gender: string
  department: string
  attendance: number
  previous_gpa: number
  study_hours: number
  assignment_score: number
  ca_score: number
  semester_result: number
}

export interface Prediction {
  id: number
  student_id?: string
  algorithm: string
  accuracy?: number
  prediction: string
  confidence?: number
  timestamp: string
}

export interface ModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  confusion_matrix: number[][]
}

export interface TrainingResult {
  best_model: string
  best_accuracy: number
  results: Record<string, ModelMetrics & { class_report?: unknown }>
}

export interface Analytics {
  total_students: number
  total_predictions: number
  performance_distribution: Record<string, number>
  department_breakdown: Record<string, Record<string, number>>
  model_comparison?: Record<string, ModelMetrics>
  recent_accuracy?: number
}
