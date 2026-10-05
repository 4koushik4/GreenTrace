import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Loader2, Handshake, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth, supabase } from "@/lib/supabase";
import { createOffer, listUserOffers, updateOfferStatus, type MarketplaceOffer } from "@/lib/marketplace";

export default function MarketplaceOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError(null);
      setOffers(await listUserOffers(user.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Offers could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setOffers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadOffers();
    if (!supabase) return;
    const channel = supabase.channel(`marketplace-offers-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_offers" }, () => { void loadOffers(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id, loadOffers]);

  const respond = async (offer: MarketplaceOffer, status: "accepted" | "rejected") => {
    setSavingId(offer.id);
    setError(null);
    try {
      await updateOfferStatus(offer.id, status);
      await loadOffers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your response could not be saved.");
    } finally {
      setSavingId(null);
    }
  };

  const counter = async (offer: MarketplaceOffer) => {
    const amount = Number(counterAmounts[offer.id]);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid counter-offer amount.");
      return;
    }
    setSavingId(offer.id);
    setError(null);
    try {
      await createOffer({ listing_id: offer.listing_id, parent_offer_id: offer.id, amount });
      setCounterAmounts((current) => ({ ...current, [offer.id]: "" }));
      await loadOffers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your counter-offer could not be sent.");
    } finally {
      setSavingId(null);
    }
  };

  const formatAmount = (amount: number) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Marketplace offers</h1>
        <p className="mt-2 text-gray-400">Review offers and negotiate with other users in real time.</p>
      </div>

      {error && <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12 text-gray-400"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading offers…</div>
      ) : offers.length === 0 ? (
        <Card className="border-slate-700 bg-slate-900/60">
          <CardContent className="py-12 text-center text-gray-400">
            <Handshake className="mx-auto mb-3 h-10 w-10 text-gray-500" />
            <p>No offers yet.</p>
            <Link to="/marketplace"><Button className="mt-4">Browse marketplace</Button></Link>
          </CardContent>
        </Card>
      ) : offers.map((offer) => {
        const isOfferCreator = offer.created_by === user?.id;
        const otherUserId = user?.id === offer.sellerId ? offer.buyer_id : offer.sellerId;
        const canRespond = offer.status === "pending" && !isOfferCreator;
        const messageLink = `/messages?recipientId=${encodeURIComponent(otherUserId)}&listingId=${encodeURIComponent(offer.listing_id)}&listingTitle=${encodeURIComponent(offer.listingTitle)}`;
        return (
          <Card key={offer.id} className="border-slate-700 bg-slate-900/60">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-white">{offer.listingTitle}</CardTitle>
                  <CardDescription className="mt-1 text-gray-400">
                    {isOfferCreator ? "You sent this offer" : "Offer received"} · {new Date(offer.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${offer.status === "accepted" ? "bg-green-500/15 text-green-300" : offer.status === "rejected" ? "bg-red-500/15 text-red-300" : offer.status === "countered" ? "bg-amber-500/15 text-amber-300" : "bg-blue-500/15 text-blue-300"}`}>
                  {offer.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-semibold text-green-300">{formatAmount(offer.amount)}</div>
              {offer.message && <p className="whitespace-pre-wrap text-sm text-gray-300">{offer.message}</p>}
              <div className="flex flex-wrap gap-2">
                <Link to={messageLink}>
                  <Button variant="outline" className="border-slate-600 text-white"><MessageCircle className="mr-2 h-4 w-4" />Message</Button>
                </Link>
                <Link to={`/listing/${encodeURIComponent(offer.listing_id)}`}>
                  <Button variant="ghost" className="text-gray-300">View listing</Button>
                </Link>
              </div>
              {canRespond && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-700 pt-4">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={counterAmounts[offer.id] ?? ""}
                    onChange={(event) => setCounterAmounts((current) => ({ ...current, [offer.id]: event.target.value }))}
                    placeholder="Counter-offer (₹)"
                    className="w-48 border-slate-600 bg-slate-800 text-white"
                    disabled={savingId === offer.id}
                  />
                  <Button onClick={() => void counter(offer)} disabled={savingId === offer.id} variant="outline" className="border-slate-600 text-white">
                    {savingId === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Counter
                  </Button>
                  <Button onClick={() => void respond(offer, "accepted")} disabled={savingId === offer.id} className="bg-green-600 hover:bg-green-700">Accept</Button>
                  <Button onClick={() => void respond(offer, "rejected")} disabled={savingId === offer.id} variant="destructive">Decline</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
