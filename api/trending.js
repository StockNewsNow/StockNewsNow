import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const windowMin = Math.min(1440, Math.max(15, parseInt(req.query?.window) || 120))
  const sourceRaw = (req.query?.source || '').toLowerCase()
  const sourcePrefix = ['reddit', 'news'].includes(sourceRaw) ? sourceRaw : ''

  const { data, error } = await supabase.rpc('trending_tickers', {
    window_minutes: windowMin,
    source_prefix: sourcePrefix,
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=20')
  return res.status(200).json(data || [])
}
