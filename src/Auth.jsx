import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Flame, ArrowRight, Mail, Lock, Loader } from 'lucide-react'
import { supabase, isConfigured } from './lib/supabase.js'
import { useAuth } from './lib/useAuth.jsx'

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [tab, setTab] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  // Already signed in → go to the app
  useEffect(() => {
    if (!authLoading && user) navigate('/app', { replace: true })
  }, [authLoading, user, navigate])

  const submit = async () => {
    setError(null); setNotice(null)
    if (!isConfigured) {
      setError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    if (!email || !password) { setError('Enter an email and password.'); return }
    if (tab === 'signup' && password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setBusy(true)
    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) {
          navigate('/app', { replace: true }) // email confirmation off → straight in
        } else {
          setNotice('Account created. Check your email to confirm, then log in.')
          setTab('login')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/app', { replace: true })
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter') submit() }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-deep)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Flame size={17} color="var(--amber)" />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, letterSpacing: '0.06em' }}>STOCK BUZZ</span>
          </Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>// terminal access</p>
            <h1 style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 600 }}>
              {tab === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
            {[['login', 'Log in'], ['signup', 'Sign up']].map(([val, label]) => (
              <button key={val} onClick={() => { setTab(val); setError(null); setNotice(null) }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 13,
                  background: tab === val ? 'var(--surface-2)' : 'transparent',
                  color: tab === val ? 'var(--text)' : 'var(--muted)',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* form card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 22px' }}>
            <label style={fieldLabel}>email</label>
            <div style={inputWrap}>
              <Mail size={15} color="var(--dim)" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKey}
                placeholder="you@example.com" autoComplete="email" style={inputStyle} />
            </div>

            <label style={{ ...fieldLabel, marginTop: 16 }}>password</label>
            <div style={inputWrap}>
              <Lock size={15} color="var(--dim)" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKey}
                placeholder={tab === 'signup' ? 'at least 6 characters' : '••••••••'}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} style={inputStyle} />
            </div>

            {error && <p style={{ ...msgStyle, color: 'var(--bear)' }}>{error}</p>}
            {notice && <p style={{ ...msgStyle, color: 'var(--bull)' }}>{notice}</p>}

            <button onClick={submit} disabled={busy}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', marginTop: 20, padding: '12px', borderRadius: 6,
                background: 'var(--amber)', color: '#000',
                fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
                opacity: busy ? 0.7 : 1,
              }}>
              {busy ? <Loader size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : null}
              {tab === 'signup' ? 'create account' : 'log in'}
              {!busy && <ArrowRight size={15} />}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 18, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            {tab === 'signup' ? 'already have an account? ' : "don't have an account? "}
            <button onClick={() => { setTab(tab === 'signup' ? 'login' : 'signup'); setError(null); setNotice(null) }}
              style={{ color: 'var(--amber)', fontFamily: 'var(--mono)', fontSize: 12 }}>
              {tab === 'signup' ? 'log in' : 'sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

const fieldLabel = { display: 'block', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 7, textTransform: 'uppercase' }
const inputWrap = { display: 'flex', alignItems: 'center', gap: 9, background: 'var(--bg-deep)', border: '1px solid var(--border-2)', borderRadius: 7, padding: '0 12px' }
const inputStyle = { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, padding: '11px 0' }
const msgStyle = { fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.5, marginTop: 14 }
