import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/useAuth.jsx'
import Landing from './Landing.jsx'
import Dashboard from './Dashboard.jsx'
import Auth from './Auth.jsx'

function FullScreenLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="cursor-blink" style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--amber)' }}>
        loading terminal
      </span>
    </div>
  )
}

// Gate /app behind a logged-in session. Pro gating happens inside Dashboard
// (so the app chrome renders behind the upgrade modal).
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/auth?mode=login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
