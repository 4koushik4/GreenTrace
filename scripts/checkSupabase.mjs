import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Missing env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_*)')
  process.exit(1)
}

const supabase = createClient(url, anon)

try {
  // Lightweight auth check
  const { data: { session }, error: authErr } = await supabase.auth.getSession()
  if (authErr) console.warn('Auth check warning (anon):', authErr.message)

  // Check a table exists and is reachable (public read: recycling_centers)
  const { count, error } = await supabase
    .from('recycling_centers')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(2)
  }

  console.log('Supabase connected. recycling_centers count =', count ?? 0)
  process.exit(0)
} catch (e) {
  console.error('Supabase connection error:', e?.message || e)
  process.exit(3)
}



