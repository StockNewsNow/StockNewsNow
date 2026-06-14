import { useState, useEffect } from 'react'

// Representative fallback so the tape always looks alive on a fresh deploy
// (before the database has data). Replaced by live /api/trending when available.
const SAMPLE = [
  { ticker: 'NVDA', avg_sentiment: 0.62, mentions: 184 },
  { ticker: 'TSLA', avg_sentiment: -0.41, mentions: 156 },
  { ticker: 'AAPL', avg_sentiment: 0.18, mentions: 142 },
  { ticker: 'PLTR', avg_sentiment: 0.71, mentions: 98 },
  { ticker: 'SPY', avg_sentiment: 0.05, mentions: 91 },
  { ticker: 'AMD', avg_sentiment: 0.34, mentions: 77 },
  { ticker: 'GME', avg_sentiment: 0.52, mentions: 64 },
  { ticker: 'META', avg_sentiment: 0.22, mentions: 58 },
  { ticker: 'MSFT', avg_sentiment: 0.15, mentions: 51 },
  { ticker: 'COIN', avg_sentiment: -0.28, mentions: 47 },
  { ticker: 'AMZN', avg_sentiment: 0.31, mentions: 44 },
  { ticker: 'HOOD', avg_sentiment: 0.44, mentions: 38 },
]

function Item({ d }) {
  const s = Number(d.avg_sentiment)
  const color = s > 0.1 ? 'var(--bull)' : s < -0.1 ? 'var(--bear)' : 'var(--neutral)'
  const arrow = s > 0.1 ? '▲' : s < -0.1 ? '▼' : '■'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 22px', fontFamily: 'var(--mono)', fontSize: 12 }}>
      <span style={{ color: 'var(--text)', fontWeight: 500, letterSpacing: '0.04em' }}>{d.ticker}</span>
      <span style={{ color }}>{arrow} {(s > 0 ? '+' : '') + s.toFixed(2)}</span>
      <span style={{ color: 'var(--dim)' }}>{d.mentions}</span>
    </span>
  )
}

export default function TickerTape() {
  const [data, setData] = useState(SAMPLE)

  useEffect(() => {
    fetch('/api/trending?window=240')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d) && d.length >= 6) setData(d.slice(0, 16)) })
      .catch(() => {})
  }, [])

  const loop = [...data, ...data] // duplicate for seamless scroll

  return (
    <div className="tape-wrap" style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-deep)',
      overflow: 'hidden',
      height: 34,
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2,
        display: 'flex', alignItems: 'center', padding: '0 12px',
        background: 'var(--amber)', color: '#000',
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
      }}>
        LIVE
      </div>
      <div className="tape-track" style={{ paddingLeft: 60 }}>
        {loop.map((d, i) => <Item key={i} d={d} />)}
      </div>
    </div>
  )
}
