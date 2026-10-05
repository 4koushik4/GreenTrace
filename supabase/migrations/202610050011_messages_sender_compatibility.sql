ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.messages
SET sender_id = from_user_id
WHERE sender_id IS NULL;
UPDATE public.messages
SET recipient_id = to_user_id
WHERE recipient_id IS NULL AND to_user_id IS NOT NULL;

ALTER TABLE public.messages ALTER COLUMN sender_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_message_participant_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.sender_id := NEW.from_user_id;
  NEW.recipient_id := NEW.to_user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_sync_participant_ids ON public.messages;
CREATE TRIGGER messages_sync_participant_ids
  BEFORE INSERT OR UPDATE OF from_user_id, to_user_id ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.sync_message_participant_ids();
