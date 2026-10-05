CREATE TABLE IF NOT EXISTS public.marketplace_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_offer_id UUID REFERENCES public.marketplace_offers(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'countered', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketplace_offers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_offers
  ADD COLUMN IF NOT EXISTS parent_offer_id UUID REFERENCES public.marketplace_offers(id) ON DELETE SET NULL;
ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.marketplace_offers'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.marketplace_offers DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END;
$$;
ALTER TABLE public.marketplace_offers ADD CONSTRAINT marketplace_offers_status_allowed
  CHECK (status IN ('pending', 'countered', 'accepted', 'rejected'));

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id TEXT,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_from_user_created_idx ON public.messages(from_user_id, created_at);
CREATE INDEX IF NOT EXISTS messages_to_user_created_idx ON public.messages(to_user_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketplace_messages_read_participants ON public.messages;
CREATE POLICY marketplace_messages_read_participants ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
DROP POLICY IF EXISTS marketplace_messages_send_as_self ON public.messages;
CREATE POLICY marketplace_messages_send_as_self ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND to_user_id IS NOT NULL
    AND to_user_id <> auth.uid()
    AND length(trim(body)) > 0
  );
GRANT SELECT, INSERT ON public.messages TO authenticated;

UPDATE public.marketplace_offers
SET created_by = buyer_id
WHERE created_by IS NULL;
ALTER TABLE public.marketplace_offers ALTER COLUMN created_by SET NOT NULL;

DROP POLICY IF EXISTS marketplace_offers_read_participants ON public.marketplace_offers;
CREATE POLICY marketplace_offers_read_participants ON public.marketplace_offers
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.marketplace_listings listing
      WHERE listing.id = marketplace_offers.listing_id
        AND listing.seller_id = auth.uid()
    )
  );
GRANT SELECT ON public.marketplace_offers TO authenticated;

CREATE OR REPLACE FUNCTION public.create_marketplace_offer(
  p_listing_id UUID,
  p_amount NUMERIC,
  p_message TEXT DEFAULT NULL,
  p_parent_offer_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offer_id UUID;
  listing_seller_id UUID;
  parent_offer RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to make an offer.' USING ERRCODE = '28000';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Offer amount must be greater than zero.' USING ERRCODE = '22023';
  END IF;

  SELECT seller_id INTO listing_seller_id
  FROM public.marketplace_listings
  WHERE id = p_listing_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This listing is unavailable.' USING ERRCODE = 'P0002';
  END IF;
  IF listing_seller_id = auth.uid() AND p_parent_offer_id IS NULL THEN
    RAISE EXCEPTION 'You cannot make an offer on your own listing.' USING ERRCODE = '42501';
  END IF;

  IF p_parent_offer_id IS NULL THEN
    INSERT INTO public.marketplace_offers(listing_id, buyer_id, created_by, amount, message, status)
    VALUES (p_listing_id, auth.uid(), auth.uid(), p_amount, NULLIF(BTRIM(p_message), ''), 'pending')
    RETURNING id INTO offer_id;
    RETURN offer_id;
  END IF;

  SELECT * INTO parent_offer
  FROM public.marketplace_offers
  WHERE id = p_parent_offer_id
  FOR UPDATE;
  IF NOT FOUND OR parent_offer.listing_id <> p_listing_id THEN
    RAISE EXCEPTION 'Offer thread not found for this listing.' USING ERRCODE = 'P0002';
  END IF;
  IF parent_offer.status <> 'pending' THEN
    RAISE EXCEPTION 'Only a pending offer can be answered.' USING ERRCODE = '55000';
  END IF;
  IF auth.uid() NOT IN (parent_offer.buyer_id, listing_seller_id)
     OR auth.uid() = parent_offer.created_by THEN
    RAISE EXCEPTION 'Only the other participant can counter this offer.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.marketplace_offers SET status = 'countered' WHERE id = p_parent_offer_id;
  INSERT INTO public.marketplace_offers(listing_id, buyer_id, created_by, parent_offer_id, amount, message, status)
  VALUES (p_listing_id, parent_offer.buyer_id, auth.uid(), p_parent_offer_id, p_amount, NULLIF(BTRIM(p_message), ''), 'pending')
  RETURNING id INTO offer_id;
  RETURN offer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_marketplace_offer(p_offer_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_offer RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to respond to an offer.' USING ERRCODE = '28000';
  END IF;
  IF p_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Offer response must be accepted or rejected.' USING ERRCODE = '22023';
  END IF;

  SELECT offer.*, listing.seller_id
  INTO target_offer
  FROM public.marketplace_offers offer
  JOIN public.marketplace_listings listing ON listing.id = offer.listing_id
  WHERE offer.id = p_offer_id
  FOR UPDATE OF offer;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found.' USING ERRCODE = 'P0002';
  END IF;
  IF target_offer.status <> 'pending' THEN
    RAISE EXCEPTION 'Only a pending offer can be accepted or declined.' USING ERRCODE = '55000';
  END IF;
  IF auth.uid() NOT IN (target_offer.buyer_id, target_offer.seller_id)
     OR auth.uid() = target_offer.created_by THEN
    RAISE EXCEPTION 'Only the other participant can respond to this offer.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.marketplace_offers SET status = p_status WHERE id = p_offer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_marketplace_offer(UUID, NUMERIC, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_marketplace_offer(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_marketplace_offer(UUID, NUMERIC, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_marketplace_offer(UUID, TEXT) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'marketplace_offers') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_offers;
    END IF;
  END IF;
END;
$$;
