import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame, ArrowRight, Activity, Gauge, Radio, Layers,
  TrendingUp, Search, Cpu, ListOrdered, Check, Terminal
} from 'lucide-react'
import TickerTape from './components/TickerTape.jsx'

const BOOT_LINES = [
  '> initializing buzz terminal v1.0 ...',
  '> connecting feeds: reddit · cnbc · yahoo · marketwatch · nasdaq',
  '> sentiment engine: VADER + finance lexicon [ok]',
  '> scanning 5 subreddits + 6 news outlets ...',
  '> ranking tickers by volume · sentiment · velocity',
  '> stream live ▰',
]

function useBootSequence() {
  const [lines, setLines] = useState([])
  const reduced = useRef(false)
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) { setLines(BOOT_LINES); return }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setLines(BOOT_LINES.slice(0, i))
      if (i >= BOOT_LINES.length) clearInterval(id)
    }, 420)
    return () => clearInterval(id)
  }, [])
  return lines
}

function Section({ children, style }) {
  return <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', ...style }}>{children}</section>
}

export default function Landing() {
  const boot = useBootSequence()

  return (
    <div style={{ minHeight: '100vh' }}>
      <TickerTape />

      {/* ── nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 30,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(7,8,10,0.82)', backdropFilter: 'blur(10px)',
      }}>
        <Section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Flame size={17} color="var(--amber)" />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, letterSpacing: '0.06em' }}>STOCK BUZZ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <a href="#features" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>features</a>
            <a href="#pricing" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>pricing</a>
            <Link to="/auth?mode=login" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>log in</Link>
            <Link to="/auth?mode=signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500,
              color: '#000', background: 'var(--amber)',
              padding: '8px 16px', borderRadius: 6,
            }}>
              get started <ArrowRight size={13} />
            </Link>
          </div>
        </Section>
      </nav>

      {/* ── hero ── */}
      <Section style={{ paddingTop: 72, paddingBottom: 56 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 48, alignItems: 'center' }} className="hero-grid">
          <div>
            <p className="eyebrow" style={{ marginBottom: 20 }}>// real-time market sentiment</p>
            <h1 style={{ fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 22 }}>
              The market talks<br />before it <span style={{ color: 'var(--amber)' }}>moves.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--muted)', maxWidth: 460, marginBottom: 32 }}>
              Stock Buzz scans the loudest rooms on Reddit and the financial press in
              real time, scores the sentiment, and ranks every ticker by what's heating
              up right now — so you see the crowd forming before it shows up in the price.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/auth?mode=signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500,
                color: '#000', background: 'var(--amber)', padding: '12px 22px', borderRadius: 6,
              }}>
                get started <ArrowRight size={15} />
              </Link>
              <a href="#pricing" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--mono)', fontSize: 13,
                color: 'var(--text)', border: '1px solid var(--border-2)', padding: '12px 22px', borderRadius: 6,
              }}>
                view pricing
              </a>
            </div>
          </div>

          {/* faux terminal window — the signature element */}
          <div style={{
            background: 'var(--bg-deep)', border: '1px solid var(--border-2)', borderRadius: 10,
            overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,176,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <Terminal size={13} color="var(--amber)" />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em' }}>buzz@terminal — live</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                {['var(--bear)','var(--amber)','var(--bull)'].map((c,i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
              </div>
            </div>
            <div style={{ padding: '16px 16px 6px', minHeight: 150 }}>
              {boot.map((l, i) => (
                <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: i === boot.length - 1 ? 'var(--amber)' : 'var(--muted)', lineHeight: 1.9 }}>
                  {l}
                </div>
              ))}
              {boot.length >= BOOT_LINES.length && (
                <span className="cursor-blink" style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--amber)' }}></span>
              )}
            </div>
            {/* mini leaderboard preview */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px 16px' }}>
              {[
                { t: 'PLTR', m: 98, s: 0.71 },
                { t: 'NVDA', m: 184, s: 0.62 },
                { t: 'TSLA', m: 156, s: -0.41 },
              ].map((r, i) => {
                const color = r.s > 0.1 ? 'var(--bull)' : r.s < -0.1 ? 'var(--bear)' : 'var(--neutral)'
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 50px 60px', gap: 10, alignItems: 'center', padding: '6px 0', fontFamily: 'var(--mono)', fontSize: 12 }}>
                    <span style={{ color: 'var(--dim)' }}>{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{r.t}</span>
                    <span style={{ textAlign: 'right', color: 'var(--muted)' }}>{r.m}</span>
                    <span style={{ textAlign: 'right', color }}>{(r.s > 0 ? '+' : '') + r.s.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* ── why it helps ── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-deep)' }}>
        <Section style={{ padding: '48px 24px' }}>
          <p className="eyebrow" style={{ marginBottom: 24 }}>// why it matters</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              ['Sentiment leads price', 'By the time a name is trending on cable news, the move is underway. Retail chatter and early coverage often shift before the chart does.'],
              ['Velocity beats volume', 'A ticker that doubled its mentions in the last hour matters more than one that\'s merely popular. Buzz surfaces what\'s accelerating.'],
              ['Tuned for how traders talk', 'Generic sentiment models miss the slang. Buzz reads "puts" and "bagholder" as bearish, "moon" and "tendies" as bullish.'],
            ].map(([h, b], i) => (
              <div key={i}>
                <h3 style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, marginBottom: 10, color: 'var(--amber)' }}>{h}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>{b}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── features ── */}
      <Section style={{ padding: '64px 24px' }} >
        <div id="features" style={{ scrollMarginTop: 80 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>// 02_capabilities</p>
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600, marginBottom: 36 }}>One screen. The whole conversation.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            [Activity, 'Real-time sentiment', 'Every mention scored from −1 bearish to +1 bullish, refreshed continuously as the conversation moves.'],
            [Gauge, 'Velocity tracking', 'See which tickers are accelerating versus fading, with a live % change against the prior window.'],
            [Layers, 'Reddit + the press', 'The loudest subreddits and six financial news outlets, unified into one ranked leaderboard.'],
            [Search, 'Drill into any name', 'Click a ticker to read the exact posts and headlines driving its score, each tagged by source.'],
          ].map(([Icon, h, b], i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '22px 22px' }}>
              <Icon size={20} color="var(--amber)" />
              <h3 style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, margin: '16px 0 8px' }}>{h}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--muted)' }}>{b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── how it works ── */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-deep)' }}>
        <Section style={{ padding: '56px 24px' }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>// 03_pipeline</p>
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600, marginBottom: 36 }}>How the signal is built</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
            {[
              [Radio, 'Scan', 'Pull fresh posts and headlines across subreddits and news feeds every few minutes.'],
              [Cpu, 'Extract', 'Identify every ticker mentioned, filtering false positives like "CEO" or "USA".'],
              [TrendingUp, 'Score', 'Run each mention through VADER plus a finance-slang lexicon for a clean sentiment value.'],
              [ListOrdered, 'Rank', 'Aggregate into a live leaderboard by volume, average sentiment, and velocity.'],
            ].map(([Icon, h, b], i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', marginBottom: 12 }}>0{i + 1}</div>
                <Icon size={19} color="var(--amber)" />
                <h3 style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, margin: '12px 0 7px' }}>{h}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--muted)' }}>{b}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── pricing ── */}
      <Section style={{ padding: '64px 24px' }}>
        <div id="pricing" style={{ scrollMarginTop: 80, textAlign: 'center', marginBottom: 44 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>// 04_access</p>
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600 }}>Pick your seat at the desk</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <PlanCard
              name="Pro" price="$40" cadence="/ month" featured
              blurb="The full terminal."
              features={['Full 50-ticker leaderboard', 'All windows: 1h · 4h · 24h', 'Refreshes every 30 sec', 'Reddit / News source filters', 'Per-ticker drill-down', 'Velocity & trend signals']}
              cta="get started" to="/auth?mode=signup" variant="solid"
            />
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)' }}>
          cancel anytime · no market data resale · informational use only
        </p>
      </Section>

      {/* ── footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-deep)' }}>
        <Section style={{ padding: '32px 24px', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Flame size={15} color="var(--amber)" />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>STOCK BUZZ</span>
          </div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', maxWidth: 520, lineHeight: 1.6 }}>
            Stock Buzz is a sentiment and popularity tracker, not investment advice. Data is
            informational only and may be delayed or incomplete. Trade at your own risk.
          </p>
        </Section>
      </footer>

      <style>{`
        @media (max-width: 760px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-grid h1 { font-size: 34px !important; }
        }
      `}</style>
    </div>
  )
}

function PlanCard({ name, price, cadence, blurb, features, cta, to, href, variant, featured, badge }) {
  const btnStyle = variant === 'solid'
    ? { background: 'var(--amber)', color: '#000' }
    : { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border-2)' }

  const Btn = () => {
    const inner = <>{cta} <ArrowRight size={14} /></>
    const common = {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500,
      padding: '12px', borderRadius: 6, marginTop: 'auto', ...btnStyle,
    }
    if (to) return <Link to={to} style={common}>{inner}</Link>
    return <a href={href} style={common}>{inner}</a>
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: featured ? 'var(--surface-2)' : 'var(--surface)',
      border: featured ? '1px solid var(--amber)' : '1px solid var(--border)',
      borderRadius: 12, padding: '26px 24px', minHeight: 420, position: 'relative',
    }}>
      {badge && (
        <span style={{
          position: 'absolute', top: -10, left: 24,
          background: 'var(--amber)', color: '#000', fontFamily: 'var(--mono)',
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          padding: '3px 10px', borderRadius: 4,
        }}>{badge}</span>
      )}
      <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 14 }}>{name}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 600 }}>{price}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--dim)' }}>{cadence}</span>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 20 }}>{blurb}</p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.4 }}>
            <Check size={15} color="var(--bull)" style={{ flexShrink: 0, marginTop: 2 }} />
            {f}
          </li>
        ))}
      </ul>
      <Btn />
    </div>
  )
}
