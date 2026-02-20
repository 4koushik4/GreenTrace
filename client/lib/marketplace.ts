import { supabase } from "@/lib/supabase";

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  price: number;
  images: string[];
  created_at: string;
};

export async function createListing(data: {
  user_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  images: string[];
}) {
  const { data: res, error } = await supabase
    .from("marketplace_listings")
    .insert([
      {
        seller_id: data.user_id,
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        price: data.price,
        images: data.images,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return res;
}

export async function listListings() {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getListing(id: string) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createOrder(data: {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
}) {
  const { data: res, error } = await supabase
    .from("marketplace_orders")
    .insert([
      {
        listing_id: data.listing_id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        price: data.price,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return res;
}

export async function createOffer(data: {
  listing_id: string;
  buyer_id: string;
  amount: number;
  message?: string;
}) {
  const { data: res, error } = await supabase
    .from("marketplace_offers")
    .insert([
      {
        listing_id: data.listing_id,
        buyer_id: data.buyer_id,
        amount: data.amount,
        message: data.message || null,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return res;
}
