import { supabase } from "./supabase";

export type WasteType =
  | "e-waste"
  | "hazardous"
  | "bulk"
  | "other"
  | "biodegradable"
  | "recyclable";
export type PickupStatus =
  | "requested"
  | "scheduled"
  | "collected"
  | "missed"
  | "cancelled";

export interface Pickup {
  id: string;
  user_id: string;
  
  name: string;
  email: string;
  phone: string;
  address: string;
  waste_type: WasteType;
  pickup_date: string; // ISO date
  description?: string;
  status: PickupStatus;
  created_at: string;
  updated_at: string;
}

const LS_KEY = "ecosort_pickups_local";

function readLocal(): Pickup[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Pickup[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Pickup[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

export async function createPickup(
  input: Omit<
    Pickup,
    "id" | "status" | "created_at" | "updated_at" | "user_id"
  > & { user_id: string },
): Promise<Pickup> {
  const payload: Omit<Pickup, "id"> = {
    user_id: input.user_id,
    
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    waste_type: input.waste_type,
    pickup_date: input.pickup_date,
    description: input.description,
    status: "scheduled",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!supabase) {
    const id = `local-${Date.now()}`;
    const item: Pickup = { id, ...payload };
    const list = readLocal();
    list.unshift(item);
    writeLocal(list);
    return item;
  }

  const { data, error } = await supabase
    .from("pickups")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as Pickup;
}

export async function listUserPickups(userId: string): Promise<Pickup[]> {
  if (!supabase) {
    return readLocal()
      .filter((p) => p.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await supabase
    .from("pickups")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Pickup[];
}

export async function updatePickupStatus(
  id: string,
  status: PickupStatus,
): Promise<void> {
  if (!supabase) {
    const list = readLocal();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        updated_at: new Date().toISOString(),
      };
      writeLocal(list);
    }
    return;
  }
  const { error } = await supabase
    .from("pickups")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
