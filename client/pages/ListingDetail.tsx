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

  useEffect(() => {
    (async () => {
      if (id) {
        setItem(await getListing(id));
      }
    })();
  }, [id]);

  const buyNow = async () => {
    if (!item) return;
    await createOrder({
      listing_id: item.id,
      buyer_id: user?.id || "mock-user-1",
      seller_id: item.user_id,
      price: item.price,
    });
    toast({
      title: "Order created",
      description: "The seller will be notified.",
    });
    nav("/marketplace");
  };

  const makeOffer = async () => {
    if (!item) return;
    const price = parseFloat(offer || "0");
    if (!price || price <= 0) {
      toast({ title: "Enter a valid offer" });
      return;
    }
    await createOffer({
      listing_id: item.id,
      buyer_id: user?.id || "mock-user-1",
      seller_id: item.user_id,
      offer_price: price,
    });
    toast({
      title: "Offer sent",
      description: "Seller can accept or counter.",
    });
    setOffer("");
  };

  if (!item)
    return (
      <div className="container mx-auto p-4 text-gray-400">
        Listing not found.
      </div>
    );

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
            <Button onClick={buyNow}>Buy Now</Button>
            <Input
              placeholder="Your offer (₹)"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" onClick={makeOffer}>
              Make Offer
            </Button>
            <Link to="/messages">
              <Button variant="ghost">Message Seller</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
