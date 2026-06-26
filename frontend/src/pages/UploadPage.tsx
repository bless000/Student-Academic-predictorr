import { useEffect, useRef, useState } from 'react'
import { datasetApi } from '../api/services'
import type { Dataset } from '../types'

export default function UploadPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message,   setMessage]  = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = () => datasetApi.list().then(setDatasets).catch(() => {})
  useEffect(() => { load() }, [])

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Only CSV files are supported.' })
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      await datasetApi.upload(file)
      setMessage({ type: 'success', text: `"${file.name}" uploaded successfully!` })
      load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setMessage({ type: 'error', text: detail ?? 'Upload failed. Check the file format.' })
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const onDelete = async (id: number) => {
    if (!confirm('Delete this dataset?')) return
    await datasetApi.delete(id)
    load()
  }

  const statusColor = (s: string) =>
    s === 'trained' ? 'text-green-700 bg-green-50' :
    s === 'processed' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Upload Dataset</h1>
      <p className="text-slate-500 mb-6">Upload a CSV file with student academic data for training or prediction.</p>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`card cursor-pointer border-2 border-dashed text-center py-16 transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <div className="text-4xl mb-3">{uploading ? '⏳' : '📁'}</div>
        <p className="font-semibold text-slate-700">
          {uploading ? 'Uploading…' : 'Drag & drop your CSV here or click to browse'}
        </p>
        <p className="text-sm text-slate-400 mt-1">Required columns: attendance, previous_gpa, study_hours, assignment_score</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
        />
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
        </div>
      )}

      {/* Required columns guide */}
      <div className="card mt-6">
        <h2 className="font-semibold text-slate-700 mb-3">Required CSV Columns</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {['attendance (0–100)', 'previous_gpa (0–4.0)', 'study_hours', 'assignment_score (0–100)',
            'ca_score (0–100)', 'semester_result (0–100)', 'department', 'gender', 'age', 'performance_category (optional)'].map(c => (
            <span key={c} className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">{c}</span>
          ))}
        </div>
      </div>

      {/* Uploaded datasets */}
      {datasets.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-semibold text-slate-700 mb-4">Your Datasets ({datasets.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Rows</th>
                  <th className="pb-2 font-medium">Cols</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Uploaded</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {datasets.map(ds => (
                  <tr key={ds.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-800">{ds.name}</td>
                    <td className="py-3 text-slate-600">{ds.row_count.toLocaleString()}</td>
                    <td className="py-3 text-slate-600">{ds.col_count}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(ds.status)}`}>
                        {ds.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{new Date(ds.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => onDelete(ds.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
