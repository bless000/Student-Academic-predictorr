import { useEffect, useState } from 'react'
import { predictApi } from '../api/services'
import type { Prediction } from '../types'

export default function ReportsPage() {
  const [history, setHistory] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(0)

  const PAGE = 20

  const load = async (p: number) => {
    setLoading(true)
    try {
      const data = await predictApi.history(p * PAGE, PAGE)
      setHistory(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  const badge = (pred: string) => {
    const cls = pred === 'High' ? 'badge-high' : pred === 'Low' ? 'badge-low' : 'badge-medium'
    return <span className={cls}>{pred}</span>
  }

  const exportCSV = () => {
    const header = 'ID,Student ID,Algorithm,Accuracy,Prediction,Confidence,Timestamp'
    const rows   = history.map(p =>
      `${p.id},${p.student_id ?? ''},${p.algorithm},${p.accuracy ?? ''},${p.prediction},${p.confidence ?? ''},${p.timestamp}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'prediction_report.csv' })
    a.click()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-500 mt-1">Prediction history and results</p>
        </div>
        <button onClick={exportCSV} disabled={history.length === 0} className="btn-secondary text-sm">
          ⬇ Export CSV
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading…</div>
        ) : history.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <p className="text-4xl mb-3">📋</p>
            <p>No predictions yet. Go to the Predict page to get started.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Algorithm</th>
                    <th className="pb-3 font-medium">Prediction</th>
                    <th className="pb-3 font-medium">Confidence</th>
                    <th className="pb-3 font-medium">Model Acc.</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 text-slate-400">#{p.id}</td>
                      <td className="py-3 font-mono text-slate-700">{p.student_id ?? '—'}</td>
                      <td className="py-3 text-slate-600">{p.algorithm}</td>
                      <td className="py-3">{badge(p.prediction)}</td>
                      <td className="py-3">
                        {p.confidence !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.confidence}%` }} />
                            </div>
                            <span className="text-slate-600">{p.confidence}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3 text-slate-600">{p.accuracy !== undefined ? `${p.accuracy}%` : '—'}</td>
                      <td className="py-3 text-slate-500">{new Date(p.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">Showing {history.length} records</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary text-sm">← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={history.length < PAGE} className="btn-secondary text-sm">Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
