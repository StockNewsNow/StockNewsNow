import { useState } from 'react'
import { Flame, Check, ArrowRight, RefreshCw, LogOut } from 'lucide-react'
import { STRIPE_PRO } from '../lib/config.js'
import { useAuth } from '../lib/useAuth.jsx'

const FEATURES = [
  'Full 50-ticker leaderboard',
  'All windows: 1h · 4h · 24h',
  'Refreshes every 30 sec',
  'Reddit / News source filters',
  'Per-ticker drill-down',
  'Velocity & trend signals',
]

export default function GoProModal() {
  const { user, refreshProfile, signOut } = useAuth()
  const [checking, setChecking] = useState(false)

  // Pass the user id so the Stripe webhook can match the payment to the account.
  const checkoutUrl = user?.id
    ? `${STRIPE_PRO}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email || '')}`
    : STRIPE_PRO

  const recheck = async () => {
    setChecking(true)
    await refreshProfile()
    setChecking(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(5,6,8,0.82)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--surface)', border: '1px solid var(--amber)',
        borderRadius: 14, padding: '30px 28px', position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: -11, left: 28,
          background: 'var(--amber)', color: '#000', fontFamily: 'var(--mono)',
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 4,
        }}>PRO REQUIRED</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
          <Flame size={18} color="var(--amber)" />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, letterSpacing: '0.05em' }}>UPGRADE TO PRO</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 22 }}>
          A Pro subscription unlocks the full terminal. Your account is ready — add a
          plan to start trading on the signal.
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 600 }}>$40</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--dim)' }}>/ month</span>
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
          {FEATURES.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text)' }}>
              <Check size={15} color="var(--bull)" style={{ flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>

        <a href={checkoutUrl} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '13px', borderRadius: 7,
          background: 'var(--amber)', color: '#000',
          fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
        }}>
          go pro — $40/mo <ArrowRight size={15} />
        </a>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button onClick={recheck} disabled={checking}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            <RefreshCw size={12} style={{ animation: checking ? 'spin 0.7s linear infinite' : 'none' }} />
            I've upgraded — refresh
          </button>
          <button onClick={signOut}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--dim)' }}>
            <LogOut size={12} /> log out
          </button>
        </div>
      </div>
    </div>
  )
}
