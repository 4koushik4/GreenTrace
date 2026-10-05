ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS content TEXT;

UPDATE public.messages
SET content = body
WHERE content IS NULL;

ALTER TABLE public.messages ALTER COLUMN content SET NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_message_participant_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.sender_id := NEW.from_user_id;
  NEW.recipient_id := NEW.to_user_id;
  NEW.content := NEW.body;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_sync_participant_ids ON public.messages;
CREATE TRIGGER messages_sync_participant_ids
  BEFORE INSERT OR UPDATE OF from_user_id, to_user_id, body ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.sync_message_participant_ids();
