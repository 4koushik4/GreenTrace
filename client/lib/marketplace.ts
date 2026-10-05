import { supabase } from "@/lib/supabase";

export type ListingCategory = "electronics" | "furniture" | "books" | "clothes" | "other";
export type ListingCondition = "new" | "like-new" | "good" | "fair" | "poor";

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

export async function listListings(filters?: {
  q?: string;
  category?: string;
  condition?: string;
}) {
  let query = supabase
    .from("marketplace_listings")
    .select("*")
    .eq("is_active", true);

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.condition) {
    query = query.eq("condition", filters.condition);
  }
  if (filters?.q) {
    query = query.ilike("title", `%${filters.q}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

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

export type MarketplaceOffer = {
  id: string;
  listing_id: string;
  buyer_id: string;
  created_by: string;
  parent_offer_id: string | null;
  amount: number;
  message: string | null;
  status: "pending" | "countered" | "accepted" | "rejected";
  created_at: string;
  listingTitle: string;
  sellerId: string;
};

export async function createOffer(data: {
  listing_id: string;
  amount: number;
  message?: string;
  parent_offer_id?: string | null;
}) {
  const { data: offerId, error } = await supabase.rpc("create_marketplace_offer", {
    p_listing_id: data.listing_id,
    p_amount: data.amount,
    p_message: data.message || null,
    p_parent_offer_id: data.parent_offer_id ?? null,
  });
  if (error) throw error;
  return offerId as string;
}

export async function listUserOffers(userId: string): Promise<MarketplaceOffer[]> {
  const { data: ownedListings, error: listingsError } = await supabase
    .from("marketplace_listings")
    .select("id,seller_id,title")
    .eq("seller_id", userId);
  if (listingsError) throw listingsError;

  const ownedListingIds = (ownedListings ?? []).map((listing) => listing.id);
  const [sentResult, receivedResult] = await Promise.all([
    supabase.from("marketplace_offers").select("*").eq("buyer_id", userId),
    ownedListingIds.length
      ? supabase.from("marketplace_offers").select("*").in("listing_id", ownedListingIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (sentResult.error) throw sentResult.error;
  if (receivedResult.error) throw receivedResult.error;

  const offers = [...new Map(
    [...(sentResult.data ?? []), ...(receivedResult.data ?? [])].map((offer) => [offer.id, offer]),
  ).values()];
  const listingIds = [...new Set(offers.map((offer) => offer.listing_id))];
  const { data: listings, error: relatedListingsError } = listingIds.length
    ? await supabase.from("marketplace_listings").select("id,seller_id,title").in("id", listingIds)
    : { data: [], error: null };
  if (relatedListingsError) throw relatedListingsError;

  const listingById = new Map(
    [...(ownedListings ?? []), ...(listings ?? [])].map((listing) => [listing.id, listing]),
  );
  return offers
    .map((offer) => {
      const listing = listingById.get(offer.listing_id);
      return {
        ...offer,
        listingTitle: listing?.title ?? "Marketplace listing",
        sellerId: listing?.seller_id ?? "",
      } as MarketplaceOffer;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateOfferStatus(offerId: string, status: "accepted" | "rejected") {
  const { error } = await supabase.rpc("respond_to_marketplace_offer", {
    p_offer_id: offerId,
    p_status: status,
  });
  if (error) throw error;
}
