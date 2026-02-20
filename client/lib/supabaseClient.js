// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Support both Vite (import.meta.env.VITE_*) and Next.js (process.env.NEXT_PUBLIC_*)
const viteEnv = typeof import !== 'undefined' && typeof import.meta !== 'undefined' ? import.meta.env : {}
const supabaseUrl = (viteEnv?.VITE_SUPABASE_URL) || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = (viteEnv?.VITE_SUPABASE_ANON_KEY) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // Non-fatal: allows app to run with mock data paths
  // Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for Vite
  // Or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for Next.js
  console.warn('Supabase env vars missing. Set VITE_/NEXT_PUBLIC_ SUPABASE URL and ANON KEY to enable auth/db.')
}

export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}) : null

export const getSupabaseClient = () => supabase
