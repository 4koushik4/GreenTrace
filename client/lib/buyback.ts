import { supabase } from "@/lib/supabase";

export type MaterialType =
  | "plastic"
  | "paper"
  | "metal"
  | "glass"
  | "e-waste"
  | "other";

export interface BuybackOrder {
  id: string;
  user_id: string;
  material_type: MaterialType;
  weight_kg: number;
  unit_price: number;
  total_amount: number;
  status: string;
  created_at: string;
}

// Price per kg
const PRICES: Record<MaterialType, number> = {
  plastic: 15,
  paper: 10,
  metal: 40,
  glass: 8,
  "e-waste": 60,
  other: 5,
};

export function getPriceQuote(material: MaterialType, weight: number) {
  return Math.round(PRICES[material] * weight);
}
export function getUnitPrice(material: string) {
  switch (material) {
    case "plastic": return 15;
    case "paper": return 10;
    case "metal": return 25;
    case "glass": return 12;
    case "e-waste": return 30;
    default: return 8;
  }
}


export async function createBuybackOrder(order) {
  const unitPrice = getUnitPrice(order.material_type);
  const total = unitPrice * order.weight_kg;

  const { data, error } = await supabase
    .from("buyback_orders")
    .insert({
      user_id: order.user_id,
      material_type: order.material_type,
      weight_kg: order.weight_kg,
      unit_price: unitPrice,
      total_amount: total,
      status: "quote",        // ✅ MUST match constraint
      payment_received: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}


export async function listBuybackOrders(userId: string) {
  const { data, error } = await supabase
    .from("buyback_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
