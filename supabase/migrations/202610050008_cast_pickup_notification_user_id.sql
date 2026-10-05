CREATE OR REPLACE FUNCTION public.notify_pickup_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(recipient_id, audience, title, message, entity_type, entity_id)
    VALUES (NULL, 'staff', 'New pickup request', NEW.name || ' requested ' || NEW.waste_type || ' pickup.', 'pickup', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(recipient_id, audience, title, message, entity_type, entity_id)
    VALUES (NEW.user_id::uuid, 'user', 'Pickup status updated', 'Your pickup request is now ' || replace(NEW.status, '_', ' ') || '.', 'pickup', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
