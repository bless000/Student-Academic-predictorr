import api from './client'
import type { Analytics, AuthToken, Dataset, Prediction, PredictInput, Student, TrainingResult, User } from '../types'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<AuthToken>('/auth/login', { username, password }).then(r => r.data),
  register: (data: { username: string; email: string; password: string; role: string }) =>
    api.post<User>('/auth/register', data).then(r => r.data),
  me: () => api.get<User>('/auth/me').then(r => r.data),
}

// ─── Dataset ──────────────────────────────────────────────────────────────────
export const datasetApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<Dataset>('/dataset/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  list: () => api.get<Dataset[]>('/dataset/').then(r => r.data),
  get: (id: number) => api.get<Dataset>(`/dataset/${id}`).then(r => r.data),
  students: (id: number, skip = 0, limit = 100) =>
    api.get<Student[]>(`/dataset/${id}/students?skip=${skip}&limit=${limit}`).then(r => r.data),
  delete: (id: number) => api.delete(`/dataset/${id}`),
}

// ─── Training ─────────────────────────────────────────────────────────────────
export const trainingApi = {
  train: (datasetId: number) =>
    api.post<TrainingResult>(`/train/${datasetId}`).then(r => r.data),
  latestResults: () =>
    api.get<TrainingResult>('/train/results/latest').then(r => r.data),
}

// ─── Prediction ───────────────────────────────────────────────────────────────
export const predictApi = {
  single: (input: PredictInput) =>
    api.post<Prediction>('/predict/single', input).then(r => r.data),
  batch: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/predict/batch', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    })
  },
  history: (skip = 0, limit = 50) =>
    api.get<Prediction[]>(`/predict/history?skip=${skip}&limit=${limit}`).then(r => r.data),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: () => api.get<Analytics>('/analytics/').then(r => r.data),
}
