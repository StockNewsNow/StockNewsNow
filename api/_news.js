// News sources for the scanner. Free RSS feeds from popular financial outlets
// (no API key needed). Each feed returns a normalized list of items:
//   { id, title, text, url, source, published }
// which api/scan.js then ticker-extracts and scores exactly like Reddit posts.

const USER_AGENT = 'stock-buzz/1.0 (news scanner)'

// Popular outlets with public market/business RSS feeds.
const RSS_FEEDS = [
  { source: 'news:cnbc',        url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' }, // markets
  { source: 'news:cnbc-fm',     url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html' },  // finance
  { source: 'news:yahoo',       url: 'https://finance.yahoo.com/news/rssindex' },
  { source: 'news:marketwatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
  { source: 'news:nasdaq',      url: 'https://www.nasdaq.com/feed/rssoutbound?category=Markets' },
  { source: 'news:investing',   url: 'https://www.investing.com/rss/news_25.rss' }, // stock market news
  { source: 'news:seekingalpha',url: 'https://seekingalpha.com/market_currents.xml' },
]

// Pull a tag's inner text from an RSS <item>, handling CDATA and entities.
function tag(block, name) {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i')
  const m = block.match(re)
  if (!m) return ''
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRss(xml, source) {
  const items = []
  const blocks = xml.split(/<item[\s>]/i).slice(1)
  for (const raw of blocks) {
    const block = raw.split(/<\/item>/i)[0]
    const title = tag(block, 'title')
    if (!title) continue
    const link = tag(block, 'link') || tag(block, 'guid')
    const desc = tag(block, 'description')
    const pub = tag(block, 'pubDate')
    items.push({
      id: `${source}:${link || title}`.slice(0, 200),
      title,
      text: `${title} ${desc}`.slice(0, 2000),
      url: link,
      source,
      published: pub ? new Date(pub).toISOString() : null,
    })
  }
  return items
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`${feed.source}: ${res.status}`)
  const xml = await res.text()
  return parseRss(xml, feed.source)
}

// Fetch everything, tolerating individual feed failures.
export async function fetchAllNews() {
  const errors = []
  const all = []

  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed))

  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
    else errors.push(r.reason?.message || 'feed error')
  }

  return { items: all, errors }
}
