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
  | "accepted"
  | "rejected"
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
    status: "requested",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!supabase) throw new Error("Supabase is required to schedule a pickup that staff can review.");

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

export async function cancelPickup(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is required to cancel a pickup.");
  const { data, error } = await supabase.rpc("cancel_own_pickup", {
    p_pickup_id: id,
  });
  if (error) {
    const functionUnavailable =
      (error.code === "PGRST202" || error.code === "42883") &&
      error.message.includes("cancel_own_pickup");
    if (!functionUnavailable) throw error;

    // Older deployments may not have applied the RPC migration yet. This
    // update remains safe because the database RLS policy restricts callers
    // to their own pickup and permits only the cancelled status.
    const { data: updated, error: updateError } = await supabase
      .from("pickups")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) {
      throw new Error("Pickup could not be cancelled. It may already be processed or not belong to this account.");
    }
    return;
  }
  if (data !== true) {
    throw new Error("Pickup could not be cancelled. It may already be processed or not belong to this account.");
  }
}
