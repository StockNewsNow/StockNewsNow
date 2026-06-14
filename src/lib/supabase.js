import { createClient } from '@supabase/supabase-js'

// Browser client. Uses the PUBLIC anon key (safe to ship) — all access is
// constrained by Row Level Security policies in supabase/schema.sql. Separate
// from the service key used server-side in api/*.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

// Guard against missing env vars so the app renders a helpful message instead
// of white-screening. When unconfigured, supabase stays null and the auth UI
// surfaces a clear "not configured" notice.
export const supabase = isConfigured ? createClient(url, anonKey) : null
