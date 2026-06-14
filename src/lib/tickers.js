// Known, liquid US tickers + popular meme/retail names + major ETFs.
// Bare uppercase words are only accepted as tickers if they appear here,
// which kills false positives like "CEO", "USA", "DD". Cashtags ($XXX) are
// accepted more liberally. Expand this set freely — it's just a guardrail.
export const KNOWN_TICKERS = new Set([
  // Mega cap / S&P leaders
  'AAPL','MSFT','NVDA','AMZN','GOOGL','GOOG','META','TSLA','AVGO','BRK',
  'LLY','JPM','V','MA','UNH','XOM','COST','HD','PG','JNJ','ABBV','MRK',
  'WMT','CVX','KO','PEP','BAC','ADBE','CRM','NFLX','AMD','INTC','QCOM',
  'TXN','ORCL','CSCO','IBM','NOW','UBER','DIS','MCD','NKE','SBUX','PYPL',
  'BA','CAT','GE','GM','F','T','VZ','PFE','WFC','GS','MS','C','SCHW',
  'BLK','SPGI','AXP','HON','LMT','RTX','DE','MMM','UPS','FDX','LOW',
  // Semis / AI
  'ARM','MU','SMCI','TSM','ASML','PLTR','SNOW','NET','DDOG','CRWD','PANW',
  'MRVL','ON','LRCX','AMAT','KLAC','DELL','ANET',
  // Popular retail / meme
  'GME','AMC','BBBY','BB','NOK','SOFI','HOOD','RIVN','LCID','NIO','XPEV',
  'COIN','MARA','RIOT','MSTR','CVNA','DKNG','RBLX','PTON','CHWY','AFRM',
  'UPST','TLRY','SNDL','WISH','CLOV','SPCE','DWAC','RDDT','SNAP','PINS',
  'SHOP','SQ','ABNB','LYFT','DASH','ZM','ROKU','TTD','U','PATH','AI',
  // EV / energy / misc growth
  'PLUG','FCEL','CCJ','ENPH','SEDG','FSLR','RUN','CHPT','QS','NKLA',
  // ETFs / indices
  'SPY','QQQ','IWM','DIA','VOO','VTI','VXX','UVXY','SQQQ','TQQQ','SOXL',
  'SOXS','ARKK','XLF','XLE','XLK','GLD','SLV','TLT','HYG','EEM','VEA',
  // Crypto-adjacent
  'BITO','GBTC','IBIT',
])

// Finance/retail-trader slang that VADER misses or scores wrong.
// Positive = bullish, negative = bearish. Tuned for r/wallstreetbets register.
const FINANCE_LEXICON = {
  moon: 2.5, mooning: 2.5, rocket: 2.0, squeeze: 1.5, breakout: 1.8,
  rip: 1.5, ripping: 1.8, ath: 1.5, bullish: 2.5, bull: 1.5, calls: 1.2,
  long: 1.0, buy: 1.0, hold: 0.8, hodl: 1.2, diamond: 1.5, tendies: 2.0,
  green: 1.0, pump: 0.8, undervalued: 1.8, oversold: 1.0, beat: 1.5,
  fire: 1.5, insane: 1.5, printing: 1.2, ripped: 1.5, soaring: 2.0,
  mooned: 2.5, gains: 1.5, winner: 1.5, surging: 1.8, popped: 1.2,
  tank: -2.0, tanking: -2.2, dump: -1.8, dumping: -2.0, crash: -2.5,
  bearish: -2.5, bear: -1.5, puts: -1.2, short: -1.2, sell: -1.0,
  selling: -1.2, bagholder: -2.0, bagholding: -2.0, rug: -2.5, rugged: -2.5,
  overvalued: -1.8, bubble: -1.5, red: -1.0, dip: -0.5, bleeding: -2.0,
  drilling: -1.8, halt: -1.5, halted: -1.5, dilution: -1.8, bankrupt: -3.0,
}

const CASHTAG_RE = /\$([A-Za-z]{1,5})\b/g
const WORD_RE = /\b([A-Z]{1,5})\b/g

// Bare words that are valid tickers but too ambiguous in prose — require a $.
const AMBIGUOUS = new Set(['A','ALL','ON','IT','SO','ARE','BE','GO','OR','AT','CAT','GM','F','T','U','AI','V','C','DE'])

export function extractTickers(text) {
  if (!text) return []
  const found = new Set()

  let m
  while ((m = CASHTAG_RE.exec(text)) !== null) {
    const sym = m[1].toUpperCase()
    if (KNOWN_TICKERS.has(sym)) found.add(sym)
  }

  while ((m = WORD_RE.exec(text)) !== null) {
    const sym = m[1]
    if (KNOWN_TICKERS.has(sym) && !AMBIGUOUS.has(sym)) found.add(sym)
  }

  return [...found]
}

// Adjust a VADER compound score with finance-slang awareness.
// Returns a value clamped to [-1, 1].
export function financeAdjust(compound, text) {
  if (!text) return compound
  const words = text.toLowerCase().match(/[a-z]+/g) || []
  let boost = 0
  for (const w of words) {
    if (FINANCE_LEXICON[w]) boost += FINANCE_LEXICON[w]
  }
  // Scale boost into the -1..1 range gently, then blend with VADER.
  const adj = compound + Math.max(-1, Math.min(1, boost / 5)) * 0.5
  return Math.max(-1, Math.min(1, adj))
}
