import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'

function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (d < 60) return `${d}s`
  if (d < 3600) return `${Math.floor(d / 60)}m`
  if (d < 86400) return `${Math.floor(d / 3600)}h`
  return `${Math.floor(d / 86400)}d`
}

export default function PostsPanel({ ticker, onClose }) {
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    setPosts(null)
    fetch(`/api/posts?ticker=${ticker}`)
      .then(r => r.json())
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [ticker])

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: 'min(420px, 90vw)',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border-2)',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, letterSpacing: '0.04em' }}>
          {ticker}
        </span>
        <button onClick={onClose} style={{ color: 'var(--muted)', display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      {posts === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 64, background: 'var(--surface-2)', borderRadius: 8, animation: 'shimmer 1.4s ease infinite' }} />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>No recent posts.</p>
      )}

      {posts && posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {posts.map((p, i) => {
            const color = p.sentiment > 0.1 ? 'var(--bull)' : p.sentiment < -0.1 ? 'var(--bear)' : 'var(--neutral)'
            return (
              <a key={i} href={p.url} target="_blank" rel="noopener"
                style={{
                  display: 'block',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  borderLeft: `2px solid ${color}`,
                }}>
                <p style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 8, color: 'var(--text)' }}>
                  {p.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--dim)' }}>
                  <span>{p.source.startsWith('news:') ? '📰 ' + p.source.slice(5) : p.source.replace('reddit:', 'r/')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color }}>{p.sentiment > 0 ? '+' : ''}{p.sentiment.toFixed(2)}</span>
                    <span>{timeAgo(p.created_at)} ago</span>
                    <ExternalLink size={11} />
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
