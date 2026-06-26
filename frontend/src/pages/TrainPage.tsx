import { useEffect, useState } from 'react'
import { datasetApi, trainingApi } from '../api/services'
import type { Dataset, TrainingResult } from '../types'

function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-blue-700">{value}%</p>
    </div>
  )
}

export default function TrainPage() {
  const [datasets,  setDatasets]  = useState<Dataset[]>([])
  const [selected,  setSelected]  = useState<number | null>(null)
  const [training,  setTraining]  = useState(false)
  const [result,    setResult]    = useState<TrainingResult | null>(null)
  const [error,     setError]     = useState('')

  useEffect(() => {
    datasetApi.list().then(list => {
      setDatasets(list)
      if (list.length > 0) setSelected(list[0].id)
    })
    // Load previous results
    trainingApi.latestResults().then(setResult).catch(() => {})
  }, [])

  const handleTrain = async () => {
    if (!selected) return
    setTraining(true)
    setError('')
    try {
      const res = await trainingApi.train(selected)
      setResult(res)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Training failed. Try again.')
    } finally {
      setTraining(false)
    }
  }

  const modelColors: Record<string, string> = {
    'Decision Tree': 'border-l-amber-500',
    'SVM':           'border-l-blue-500',
    'ANN':           'border-l-purple-500',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Train Model</h1>
      <p className="text-slate-500 mb-6">Train Decision Tree, SVM, and ANN on your dataset. The best model is saved automatically.</p>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="label">Select Dataset</label>
            <select
              className="input"
              value={selected ?? ''}
              onChange={e => setSelected(Number(e.target.value))}
              disabled={training}
            >
              <option value="" disabled>Choose a dataset…</option>
              {datasets.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name} ({ds.row_count} rows)</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleTrain}
            disabled={!selected || training}
            className="btn-primary flex items-center gap-2"
          >
            {training ? (
              <><span className="animate-spin">⏳</span> Training all 3 models…</>
            ) : '🧠 Start Training'}
          </button>
        </div>

        {training && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">Training in progress…</p>
            <div className="space-y-1">
              {['Decision Tree', 'SVM (RBF Kernel)', 'ANN (128-64-32)'].map(m => (
                <div key={m} className="flex items-center gap-2">
                  <span className="animate-pulse">⚡</span> {m}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Best model banner */}
          <div className="card mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Best Performing Model</p>
                <p className="text-2xl font-bold mt-1">🏆 {result.best_model}</p>
                <p className="text-blue-200 text-sm mt-1">Saved and ready for predictions</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black">{result.best_accuracy}%</p>
                <p className="text-blue-200 text-sm">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Per-model breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(result.results)
              .filter(([k]) => k !== 'best_model')
              .map(([name, metrics]) => {
                const m = metrics as { accuracy: number; precision: number; recall: number; f1_score: number }
                return (
                  <div key={name} className={`card border-l-4 ${modelColors[name] ?? 'border-l-slate-400'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-800">{name}</h3>
                      {name === result.best_model && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Best</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <MetricBadge label="Accuracy"  value={m.accuracy} />
                      <MetricBadge label="Precision" value={m.precision} />
                      <MetricBadge label="Recall"    value={m.recall} />
                      <MetricBadge label="F1 Score"  value={m.f1_score} />
                    </div>
                  </div>
                )
              })}
          </div>

          <p className="mt-4 text-xs text-slate-400 text-center">
            Models evaluated using 80/20 train-test split with stratified sampling
          </p>
        </>
      )}
    </div>
  )
}
