import vader from 'vader-sentiment'
import { createClient } from '@supabase/supabase-js'
import { extractTickers, financeAdjust } from '../src/lib/tickers.js'
import { fetchAllNews } from './_news.js'

// Subreddits to scan. 'new' catches fresh chatter; 'hot' catches what's surging.
const SUBREDDITS = [
  'wallstreetbets',
  'stocks',
  'investing',
  'StockMarket',
  'options',
]

const USER_AGENT = 'stock-buzz/1.0 (sentiment leaderboard)'

async function fetchSubreddit(sub, sort = 'new', limit = 100) {
  const url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Reddit ${sub} ${sort}: ${res.status}`)
  const json = await res.json()
  return (json?.data?.children || []).map(c => c.data)
}

function score(text) {
  const clean = (text || '').slice(0, 2000)
  const base = vader.SentimentIntensityAnalyzer.polarity_scores(clean).compound
  return financeAdjust(base, clean)
}

// ---- Reddit source ----
async function collectReddit(rows, seen, errors) {
  for (const sub of SUBREDDITS) {
    for (const sort of ['new', 'hot']) {
      try {
        const posts = await fetchSubreddit(sub, sort)
        for (const post of posts) {
          if (seen.has(post.id)) continue
          seen.add(post.id)
          const text = `${post.title || ''} ${post.selftext || ''}`
          const tickers = extractTickers(text)
          if (tickers.length === 0) continue
          const sentiment = score(text)
          for (const ticker of tickers) {
            rows.push({
              ticker,
              source: `reddit:${sub}`,
              sentiment,
              title: (post.title || '').slice(0, 300),
              url: `https://reddit.com${post.permalink}`,
              post_id: post.id,
              score: post.score || 0,
            })
          }
        }
      } catch (e) {
        errors.push(e.message)
      }
    }
  }
}

// ---- News source ----
async function collectNews(rows, seen, errors) {
  const { items, errors: newsErrors } = await fetchAllNews()
  errors.push(...newsErrors)
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    // News headlines mention tickers by name/cashtag; extract the same way.
    const tickers = extractTickers(item.text)
    if (tickers.length === 0) continue
    const sentiment = score(item.text)
    for (const ticker of tickers) {
      rows.push({
        ticker,
        source: item.source,
        sentiment,
        title: item.title.slice(0, 300),
        url: item.url,
        post_id: item.id,
        score: 0,
      })
    }
  }
}

export default async function handler(req, res) {
  // Protect the endpoint so only your scheduler can trigger a scan.
  const secret = (req.query && req.query.secret) ||
    (req.headers.authorization || '').replace('Bearer ', '')
  if (!process.env.SCAN_SECRET || secret !== process.env.SCAN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const rows = []
  const seen = new Set()
  const errors = []

  // Run both sources; failures in one don't sink the other.
  await Promise.all([
    collectReddit(rows, seen, errors),
    collectNews(rows, seen, errors),
  ])

  if (rows.length === 0) {
    return res.status(200).json({ inserted: 0, errors, note: 'No tickers found this scan' })
  }

  const { error } = await supabase
    .from('mentions')
    .upsert(rows, { onConflict: 'post_id,ticker', ignoreDuplicates: true })

  if (error) {
    return res.status(500).json({ error: error.message, attempted: rows.length })
  }

  const bySource = {}
  for (const r of rows) {
    const kind = r.source.split(':')[0]
    bySource[kind] = (bySource[kind] || 0) + 1
  }

  return res.status(200).json({
    inserted: rows.length,
    tickers: [...new Set(rows.map(r => r.ticker))].length,
    bySource,
    errors,
  })
}
