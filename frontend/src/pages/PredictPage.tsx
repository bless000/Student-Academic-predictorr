import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { predictApi } from '../api/services'
import type { Prediction, PredictInput } from '../types'

const DEPARTMENTS = [
  'Computer Science', 'Engineering', 'Business Admin',
  'Medicine', 'Law', 'Education', 'Accounting', 'Economics',
]

function PerformanceBadge({ level }: { level: string }) {
  const classes = {
    High:   'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low:    'bg-red-100 text-red-800 border-red-200',
  }[level] ?? 'bg-slate-100 text-slate-700'

  const icons = { High: '✅', Medium: '⚠️', Low: '🔴' }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border ${classes}`}>
      {icons[level as keyof typeof icons]} {level} Performer
    </span>
  )
}

export default function PredictPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<PredictInput>({
    defaultValues: { age: 20, gender: 'Male', department: 'Computer Science' },
  })
  const [result,    setResult]    = useState<Prediction | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [batchFile, setBatchFile] = useState<File | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onSubmit = async (data: PredictInput) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const r = await predictApi.single(data)
      setResult(r)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Prediction failed. Please train a model first.')
    } finally {
      setLoading(false)
    }
  }

  const onBatchPredict = async () => {
    if (!batchFile) return
    setBatchLoading(true)
    try {
      const resp = await predictApi.batch(batchFile)
      const url  = URL.createObjectURL(new Blob([resp.data]))
      const a    = document.createElement('a')
      a.href     = url
      a.download = `predictions_${batchFile.name}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Batch prediction failed.')
    } finally {
      setBatchLoading(false)
    }
  }

  const Field = ({ name, label, type = 'number', min, max, step }: {
    name: keyof PredictInput; label: string; type?: string; min?: number; max?: number; step?: number
  }) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        min={min} max={max} step={step}
        className="input"
        {...register(name, { required: `${label} is required`, valueAsNumber: type === 'number' })}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Predict Performance</h1>
      <p className="text-slate-500 mb-6">Enter student data to predict academic performance category.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-slate-700 mb-4">Student Information</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Student ID (optional)</label>
                <input type="text" className="input" placeholder="ST0001" {...register('student_id')} />
              </div>
              <Field name="age" label="Age" min={15} max={60} />
              <div>
                <label className="label">Gender</label>
                <select className="input" {...register('gender', { required: true })}>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input" {...register('department', { required: true })}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <Field name="attendance"       label="Attendance (%)"      min={0} max={100} step={0.1} />
              <Field name="previous_gpa"     label="Previous GPA (0–4)"  min={0} max={4}   step={0.01} />
              <Field name="study_hours"      label="Study Hours/Day"     min={0} max={24}  step={0.5} />
              <Field name="assignment_score" label="Assignment Score (%)" min={0} max={100} step={0.1} />
              <Field name="ca_score"         label="CA Score (%)"        min={0} max={100} step={0.1} />
              <Field name="semester_result"  label="Semester Result (%)" min={0} max={100} step={0.1} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? '⏳ Predicting…' : '🔮 Predict Performance'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
          )}
        </div>

        {/* Result + Batch */}
        <div className="space-y-4">
          {/* Single result */}
          <div className="card min-h-48">
            <h2 className="font-semibold text-slate-700 mb-4">Prediction Result</h2>
            {result ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <PerformanceBadge level={result.prediction} />
                </div>
                {result.confidence !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Confidence</span>
                      <span className="font-bold">{result.confidence}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                  <p className="font-medium mb-1">📋 Recommendation</p>
                  <p>
                    {result.prediction === 'High'   && 'Student is on track. Maintain current study habits and attendance.'}
                    {result.prediction === 'Medium' && 'Additional academic support recommended. Focus on improving assignment scores and study hours.'}
                    {result.prediction === 'Low'    && 'Urgent intervention required. Schedule counselling and academic support sessions immediately.'}
                  </p>
                </div>
                <p className="text-xs text-slate-400">Algorithm: {result.algorithm} · Accuracy: {result.accuracy}%</p>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8 text-sm">
                Fill in the form and click Predict
              </div>
            )}
          </div>

          {/* Batch prediction */}
          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">Batch Prediction</h2>
            <p className="text-xs text-slate-500 mb-3">Upload a CSV to predict all students at once and download results.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => setBatchFile(e.target.files?.[0] ?? null)}
            />
            {batchFile ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 truncate">📎 {batchFile.name}</p>
                <div className="flex gap-2">
                  <button onClick={onBatchPredict} disabled={batchLoading} className="btn-primary text-sm flex-1">
                    {batchLoading ? '⏳ Processing…' : '⬇ Download Predictions'}
                  </button>
                  <button onClick={() => setBatchFile(null)} className="btn-secondary text-sm">Clear</button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="btn-secondary w-full text-sm">
                📁 Select CSV File
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
