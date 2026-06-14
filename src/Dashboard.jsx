import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, TrendingUp, TrendingDown, Minus, Flame, ChevronLeft, LogOut } from 'lucide-react'
import SentimentBar from './components/SentimentBar.jsx'
import PostsPanel from './components/PostsPanel.jsx'
import TickerTape from './components/TickerTape.jsx'
import GoProModal from './components/GoProModal.jsx'
import { useAuth } from './lib/useAuth.jsx'

const REFRESH = 30 // seconds
const WINDOWS = [
  { label: '1h', minutes: 60 },
  { label: '4h', minutes: 240 },
  { label: '24h', minutes: 1440 },
]
const SOURCES = [
  { label: 'All', value: '' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'News', value: 'news' },
]

export default function Dashboard() {
  const { isPro, signOut, profile } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [windowMin, setWindowMin] = useState(60)
  const [source, setSource] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [countdown, setCountdown] = useState(REFRESH)
  const [selected, setSelected] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const timer = useRef(null)
  const cd = useRef(null)

  const load = async (mins, src, spin = false) => {
    if (spin) setSpinning(true)
    setError(null)
    try {
      const res = await fetch(`/api/trending?window=${mins}&source=${src}`)
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
      setUpdatedAt(new Date())
      setCountdown(REFRESH)
    } catch {
      setError('Could not load trending data. Is the database set up and a scan run yet?')
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    load(windowMin, source)
    clearInterval(timer.current); clearInterval(cd.current)
    timer.current = setInterval(() => load(windowMin, source), REFRESH * 1000)
    cd.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => { clearInterval(timer.current); clearInterval(cd.current) }
  }, [windowMin, source])

  const maxMentions = Math.max(1, ...rows.map(r => Number(r.mentions)))

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <TickerTape />
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: 'rgba(7,8,10,0.9)', backdropFilter: 'blur(12px)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }} aria-label="Back to home">
            <ChevronLeft size={16} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flame size={17} color="var(--amber)" />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, letterSpacing: '0.05em' }}>
              STOCK BUZZ
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', border: '1px solid var(--amber-dim)', background: 'var(--amber-dim)', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em' }}>
              TERMINAL
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
            refresh {countdown}s
          </span>
          <button onClick={() => load(windowMin, source, true)} disabled={spinning}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>
            <RefreshCw size={12} style={{ animation: spinning ? 'spin 0.6s linear infinite' : 'none' }} />
            refresh
          </button>
          {isPro && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bull)', border: '1px solid var(--bull-dim)', background: 'var(--bull-dim)', padding: '4px 8px', borderRadius: 4, letterSpacing: '0.06em' }}>
              PRO
            </span>
          )}
          <button onClick={signOut} title="Log out"
            style={{ display: 'flex', alignItems: 'center', color: 'var(--dim)' }} aria-label="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              {WINDOWS.map(w => (
                <button key={w.minutes} onClick={() => setWindowMin(w.minutes)}
                  style={{
                    padding: '6px 16px', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 12,
                    background: windowMin === w.minutes ? 'var(--surface-2)' : 'transparent',
                    color: windowMin === w.minutes ? 'var(--text)' : 'var(--muted)',
                  }}>
                  {w.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              {SOURCES.map(s => (
                <button key={s.value} onClick={() => setSource(s.value)}
                  style={{
                    padding: '6px 16px', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 12,
                    background: source === s.value ? 'var(--surface-2)' : 'transparent',
                    color: source === s.value ? 'var(--text)' : 'var(--muted)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {updatedAt && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)' }}>
              updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        {/* column header */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px 150px 70px', gap: 12, padding: '0 16px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>#</span><span>Ticker</span><span style={{ textAlign: 'right' }}>Mentions</span><span style={{ textAlign: 'right' }}>Sentiment</span><span style={{ textAlign: 'right' }}>Trend</span>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 56, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', animation: 'shimmer 1.4s ease infinite', opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '20px 24px', borderRadius: 10, border: '1px solid var(--bear)', background: 'var(--bear-dim)', color: 'var(--bear)', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: '50px 24px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
            No chatter in this window yet. Trigger a scan and check back.
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((r, i) => {
              const mentions = Number(r.mentions)
              const sentiment = Number(r.avg_sentiment)
              const vel = r.velocity === null ? null : Number(r.velocity)
              const barPct = (mentions / maxMentions) * 100
              return (
                <button key={r.ticker} onClick={() => setSelected(r.ticker)}
                  style={{
                    display: 'grid', gridTemplateColumns: '36px 1fr 90px 150px 70px', gap: 12,
                    alignItems: 'center', textAlign: 'left',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* mention volume bar behind the row */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barPct}%`, background: 'rgba(255,176,0,0.05)', pointerEvents: 'none' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: i < 3 ? 'var(--amber)' : 'var(--dim)', position: 'relative' }}>
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, letterSpacing: '0.03em', position: 'relative' }}>
                    {r.ticker}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 14, textAlign: 'right', position: 'relative' }}>
                    {mentions}
                  </span>
                  <div style={{ position: 'relative', justifySelf: 'end' }}>
                    <SentimentBar value={sentiment} />
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, fontFamily: 'var(--mono)', fontSize: 12, position: 'relative',
                    color: vel === null ? 'var(--dim)' : vel > 0 ? 'var(--bull)' : vel < 0 ? 'var(--bear)' : 'var(--neutral)' }}>
                    {vel === null ? <Minus size={12} /> : vel > 0 ? <TrendingUp size={12} /> : vel < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                    {vel === null ? 'new' : `${vel > 0 ? '+' : ''}${vel}%`}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <p style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--dim)', lineHeight: 1.6, textAlign: 'center' }}>
          Sentiment from Reddit posts scored with VADER + finance lexicon. Not investment advice.
        </p>
      </main>

      {selected && isPro && <PostsPanel ticker={selected} onClose={() => setSelected(null)} />}

      {!isPro && <GoProModal />}

      <style>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        @media (max-width: 640px) {
          main > div [style*="grid-template-columns"] { font-size: 12px; }
        }
      `}</style>
    </div>
  )
}
