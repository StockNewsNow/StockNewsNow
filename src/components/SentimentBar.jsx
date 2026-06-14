export default function SentimentBar({ value }) {
  // value: -1 (bearish) .. 1 (bullish)
  const pct = ((value + 1) / 2) * 100
  const color = value > 0.1 ? 'var(--bull)' : value < -0.1 ? 'var(--bear)' : 'var(--neutral)'
  const label = value > 0.1 ? 'bullish' : value < -0.1 ? 'bearish' : 'neutral'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 130 }}>
      <div style={{
        position: 'relative',
        flex: 1,
        height: 5,
        borderRadius: 3,
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: 1,
          background: 'var(--dim)',
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          background: color,
          borderRadius: 3,
          ...(value >= 0
            ? { left: '50%', width: `${pct - 50}%` }
            : { right: '50%', width: `${50 - pct}%` }),
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color,
        minWidth: 48,
        textAlign: 'right',
      }}>
        {label}
      </span>
    </div>
  )
}
