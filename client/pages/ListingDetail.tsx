import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getListing,
  createOrder,
  createOffer,
  Listing,
} from "@/lib/marketplace";
import { useAuth } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [item, setItem] = useState<Listing | null>(null);
  const [offer, setOffer] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadListing = async () => {
      if (!id) {
        setLoadError("Listing not found.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const listing = await getListing(id);
        if (active) setItem(listing);
      } catch (cause) {
        if (active) {
          setItem(null);
          setLoadError(cause instanceof Error ? `Unable to load listing: ${cause.message}` : "Unable to load listing.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadListing();
    return () => {
      active = false;
    };
  }, [id]);

  const buyNow = async () => {
    if (!item) return;
    if (!user?.id) {
      toast({ title: "Sign in required", description: "Sign in to place an order." });
      return;
    }
    if (user.id === item.seller_id) {
      toast({ title: "You cannot buy your own listing." });
      return;
    }
    setActionLoading(true);
    try {
      await createOrder({
        listing_id: item.id,
        buyer_id: user.id,
        seller_id: item.seller_id,
        price: item.price,
      });
      toast({
        title: "Order created",
        description: "The seller will be notified.",
      });
      nav("/marketplace");
    } catch (cause) {
      toast({
        title: "Order unavailable",
        description: cause instanceof Error ? cause.message : "The order could not be saved.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const makeOffer = async () => {
    if (!item) return;
    if (!user?.id) {
      toast({ title: "Sign in required", description: "Sign in to make an offer." });
      return;
    }
    if (user.id === item.seller_id) {
      toast({ title: "You cannot make an offer on your own listing." });
      return;
    }
    const price = parseFloat(offer || "0");
    if (!price || price <= 0) {
      toast({ title: "Enter a valid offer" });
      return;
    }
    setActionLoading(true);
    try {
      await createOffer({
        listing_id: item.id,
        amount: price,
      });
      toast({
        title: "Offer sent",
        description: "The other user can accept, decline, or counter your offer.",
      });
      setOffer("");
    } catch (cause) {
      toast({
        title: "Offer unavailable",
        description: cause instanceof Error ? cause.message : "The offer could not be saved.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return <div className="container mx-auto p-4 text-gray-400">Loading listing…</div>;

  if (!item)
    return (
      <div className="container mx-auto p-4 text-gray-400">
        {loadError || "Listing not found."}
      </div>
    );

  const messageLink = user
    ? `/messages?recipientId=${encodeURIComponent(item.seller_id)}&listingId=${encodeURIComponent(item.id)}&listingTitle=${encodeURIComponent(item.title)}`
    : "/login";
  const isOwnListing = user?.id === item.seller_id;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Link to="/marketplace" className="text-sm text-gray-400">
        ← Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>
            {item.category} • {item.condition}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.images?.[0] && (
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-full h-64 object-cover rounded"
            />
          )}
          <div className="text-green-400 text-2xl font-bold">₹{item.price}</div>
          {item.description && (
            <p className="text-gray-300">{item.description}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={buyNow} disabled={actionLoading || isOwnListing}>Buy Now</Button>
            <Input
              placeholder="Your offer (₹)"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" onClick={makeOffer} disabled={actionLoading || isOwnListing}>
              Make Offer
            </Button>
            {isOwnListing ? (
              <Button variant="ghost" disabled>Message Seller</Button>
            ) : (
              <Link to={messageLink}>
                <Button variant="ghost">Message Seller</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
