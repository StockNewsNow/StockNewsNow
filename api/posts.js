import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const ticker = (req.query?.ticker || '').toUpperCase()
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data, error } = await supabase
    .from('mentions')
    .select('title, url, sentiment, source, created_at, score')
    .eq('ticker', ticker)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) return res.status(500).json({ error: error.message })

  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=20')
  return res.status(200).json(data || [])
}
