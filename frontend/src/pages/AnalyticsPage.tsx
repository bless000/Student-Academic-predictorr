import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, Title,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { analyticsApi, trainingApi } from '../api/services'
import type { Analytics, TrainingResult } from '../types'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [training,  setTraining]  = useState<TrainingResult | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.allSettled([
      analyticsApi.get().then(setAnalytics),
      trainingApi.latestResults().then(setTraining),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-slate-400">Loading analytics…</div>
  if (!analytics) return <div className="p-8 text-slate-400">No analytics data yet. Upload a dataset first.</div>

  const perfDist = analytics.performance_distribution
  const doughnutData = {
    labels: Object.keys(perfDist),
    datasets: [{
      data: Object.values(perfDist),
      backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
      borderColor: ['#16a34a', '#ca8a04', '#dc2626'],
      borderWidth: 1,
    }],
  }

  // Department bar chart
  const depts = Object.keys(analytics.department_breakdown).slice(0, 8)
  const barData = {
    labels: depts,
    datasets: [
      {
        label: 'High',
        data: depts.map(d => analytics.department_breakdown[d]?.High ?? 0),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Medium',
        data: depts.map(d => analytics.department_breakdown[d]?.Medium ?? 0),
        backgroundColor: '#eab308',
      },
      {
        label: 'Low',
        data: depts.map(d => analytics.department_breakdown[d]?.Low ?? 0),
        backgroundColor: '#ef4444',
      },
    ],
  }

  // Model comparison bar
  const modelResults = training?.results ?? {}
  const modelNames   = Object.keys(modelResults).filter(k => k !== 'best_model')
  const modelBarData = {
    labels: modelNames,
    datasets: [
      { label: 'Accuracy',  data: modelNames.map(m => (modelResults[m] as { accuracy?: number }).accuracy ?? 0),  backgroundColor: '#3b82f6' },
      { label: 'Precision', data: modelNames.map(m => (modelResults[m] as { precision?: number }).precision ?? 0), backgroundColor: '#8b5cf6' },
      { label: 'Recall',    data: modelNames.map(m => (modelResults[m] as { recall?: number }).recall ?? 0),    backgroundColor: '#06b6d4' },
      { label: 'F1 Score',  data: modelNames.map(m => (modelResults[m] as { f1_score?: number }).f1_score ?? 0),  backgroundColor: '#f59e0b' },
    ],
  }

  const chartOpts = { responsive: true, plugins: { legend: { position: 'bottom' as const } } }
  const barOpts   = { ...chartOpts, scales: { y: { beginAtZero: true, max: 100 } } }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Analytics</h1>
      <p className="text-slate-500 mb-6">Visualize student performance patterns and model comparisons.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students',   value: analytics.total_students.toLocaleString() },
          { label: 'Predictions Made', value: analytics.total_predictions.toLocaleString() },
          { label: 'Best Model',       value: training?.best_model ?? '—' },
          { label: 'Top Accuracy',     value: training ? `${training.best_accuracy}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-blue-700">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance distribution */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Performance Distribution</h2>
          {Object.keys(perfDist).length > 0 ? (
            <div className="max-w-xs mx-auto">
              <Doughnut data={doughnutData} options={chartOpts} />
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No data available</p>
          )}
        </div>

        {/* Model comparison */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Algorithm Comparison</h2>
          {modelNames.length > 0 ? (
            <Bar data={modelBarData} options={barOpts} />
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No training results yet</p>
          )}
        </div>
      </div>

      {/* Department breakdown */}
      {depts.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Performance by Department</h2>
          <Bar
            data={barData}
            options={{
              ...chartOpts,
              scales: { x: { stacked: false }, y: { beginAtZero: true } },
              plugins: { ...chartOpts.plugins, title: { display: false } },
            }}
          />
        </div>
      )}
    </div>
  )
}
