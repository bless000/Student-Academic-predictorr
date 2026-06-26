import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ui/ProtectedRoute'
import Layout from './components/layout/Layout'
import LoginPage    from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage   from './pages/UploadPage'
import TrainPage    from './pages/TrainPage'
import PredictPage  from './pages/PredictPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ReportsPage  from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="upload"     element={<UploadPage />} />
            <Route path="train"      element={<TrainPage />} />
            <Route path="predict"    element={<PredictPage />} />
            <Route path="analytics"  element={<AnalyticsPage />} />
            <Route path="reports"    element={<ReportsPage />} />
            <Route path="settings"   element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
