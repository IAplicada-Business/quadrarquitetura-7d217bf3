
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function for new lead notifications (rule 5)
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (
      admin_record.user_id,
      'new_lead',
      'Novo lead recebido',
      COALESCE(NEW.name, '') || ' — ' || COALESCE(NEW.email, 'sem email') || ' — via formulário',
      'lead',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger on lead_form_submissions
CREATE TRIGGER on_new_lead_submission
  AFTER INSERT ON public.lead_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
