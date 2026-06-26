import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/dashboard',  label: 'Dashboard',     icon: '📊' },
  { to: '/upload',     label: 'Upload Dataset', icon: '📁' },
  { to: '/train',      label: 'Train Model',    icon: '🧠' },
  { to: '/predict',    label: 'Predict',        icon: '🔮' },
  { to: '/analytics',  label: 'Analytics',      icon: '📈' },
  { to: '/reports',    label: 'Reports',        icon: '📋' },
  { to: '/settings',   label: 'Settings',       icon: '⚙️' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">SP</div>
            <div>
              <p className="text-sm font-bold leading-tight">Student Predictor</p>
              <p className="text-xs text-blue-300">ML Performance System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold uppercase">
              {user?.username?.[0] ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-xs text-blue-300 hover:text-white transition-colors">
            → Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
