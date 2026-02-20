import { supabase } from './supabaseClient'

export const signUp = async (email, password) => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signUp({ email, password })
}

export const signIn = async (email, password) => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signInWithPassword({ email, password })
}

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signInWithOAuth({ provider: 'google' })
}

export const signOut = async () => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signOut()
}

export const getUser = async () => {
  if (!supabase) throw new Error('Supabase not configured')
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}



