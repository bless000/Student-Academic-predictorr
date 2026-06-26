import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi, trainingApi } from '../api/services'
import type { Analytics, TrainingResult } from '../types'
import { useAuth } from '../hooks/useAuth'

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [training,  setTraining]  = useState<TrainingResult | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.allSettled([
      analyticsApi.get().then(setAnalytics),
      trainingApi.latestResults().then(setTraining),
    ]).finally(() => setLoading(false))
  }, [])

  const perfDist = analytics?.performance_distribution ?? {}
  const total    = Object.values(perfDist).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.username} 👋
        </h1>
        <p className="text-slate-500 mt-1">Student Academic Performance Prediction System</p>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading dashboard…</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Students"   value={analytics?.total_students ?? 0}    icon="👥" color="bg-blue-100" />
            <StatCard label="Predictions Made" value={analytics?.total_predictions ?? 0} icon="🔮" color="bg-purple-100" />
            <StatCard label="Best Model"        value={training?.best_model ?? '—'}       icon="🧠" color="bg-green-100" />
            <StatCard label="Model Accuracy"    value={training ? `${training.best_accuracy}%` : '—'} icon="🎯" color="bg-yellow-100" />
          </div>

          {/* Performance distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Performance Distribution</h2>
              {total > 0 ? (
                <div className="space-y-3">
                  {(['High', 'Medium', 'Low'] as const).map(cat => {
                    const count = perfDist[cat] ?? 0
                    const pct   = Math.round((count / total) * 100)
                    const colors = { High: 'bg-green-500', Medium: 'bg-yellow-500', Low: 'bg-red-500' }
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{cat} Performer</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${colors[cat]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No data yet — upload a dataset to get started.</p>
              )}
            </div>

            {/* Model comparison */}
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Algorithm Comparison</h2>
              {training?.results ? (
                <div className="space-y-3">
                  {Object.entries(training.results)
                    .filter(([k]) => k !== 'best_model')
                    .map(([name, metrics]) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-slate-500">F1: {(metrics as { f1_score?: number }).f1_score ?? '—'}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-700">{(metrics as { accuracy?: number }).accuracy ?? '—'}%</p>
                          {name === training.best_model && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Best</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No model trained yet.</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/upload"  className="btn-primary">📁 Upload Dataset</Link>
              <Link to="/train"   className="btn-secondary">🧠 Train Model</Link>
              <Link to="/predict" className="btn-secondary">🔮 Make Prediction</Link>
              <Link to="/analytics" className="btn-secondary">📈 View Analytics</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
