import { useAuth } from '../hooks/useAuth'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
      <p className="text-slate-500 mb-6">Account and system configuration</p>

      {/* Profile */}
      <div className="card mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Username', value: user?.username },
            { label: 'Email',    value: user?.email },
            { label: 'Role',     value: user?.role },
            { label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium text-slate-800 capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="card mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">System Configuration</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: 'ML Algorithms',   value: 'Decision Tree, SVM, ANN' },
            { label: 'Target Accuracy', value: '≥ 85%' },
            { label: 'Performance Classes', value: 'High, Medium, Low' },
            { label: 'Max Upload Size', value: '50 MB CSV' },
            { label: 'API Version',     value: '1.0.0' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4">Performance Thresholds</h2>
        <div className="space-y-3">
          {[
            { label: 'High Performer',   range: 'Composite score ≥ 72', color: 'bg-green-500' },
            { label: 'Medium Performer', range: 'Composite score 50–71', color: 'bg-yellow-500' },
            { label: 'Low Performer',    range: 'Composite score < 50',  color: 'bg-red-500' },
          ].map(({ label, range, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{range}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Composite score = weighted combination of attendance (20%), GPA (25%), study hours (15%), assignment score (20%), CA score (20%)
        </p>
      </div>
    </div>
  )
}
