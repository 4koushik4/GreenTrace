import { supabase } from './supabase';

export interface Message {
  id: string;
  pickup_id?: string | null;
  from_user_id: string;
  to_user_id?: string | null;
  body: string;
  created_at: string;
}

const LS_KEY = 'ecosort_messages_local';

function readLocal(): Message[] { try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function writeLocal(list: Message[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {} }

export async function sendMessage(msg: Omit<Message, 'id'|'created_at'>): Promise<Message> {
  const payload = { ...msg, created_at: new Date().toISOString() };
  if (!supabase) {
    const item: Message = { id: `local-${Date.now()}`, ...payload };
    const list = readLocal();
    list.push(item);
    writeLocal(list);
    return item;
  }
  const { data, error } = await supabase.from('messages').insert(payload).select('*').single();
  if (error) throw error;
  return data as Message;
}

export async function listMessages(filter: { pickup_id?: string; user_id?: string }): Promise<Message[]> {
  if (!supabase) {
    let list = readLocal();
    if (filter.pickup_id) list = list.filter(m => m.pickup_id === filter.pickup_id);
    if (filter.user_id) list = list.filter(m => m.from_user_id === filter.user_id || m.to_user_id === filter.user_id);
    return list.sort((a,b)=>a.created_at.localeCompare(b.created_at));
  }
  let query = supabase.from('messages').select('*');
  if (filter.pickup_id) query = query.eq('pickup_id', filter.pickup_id);
  if (filter.user_id) query = query.or(`from_user_id.eq.${filter.user_id},to_user_id.eq.${filter.user_id}`);
  const { data, error } = await query.order('created_at');
  if (error) throw error;
  return (data || []) as Message[];
}
