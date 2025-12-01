-- Create webhook trigger for awarding loyalty points when appointment is completed
CREATE OR REPLACE FUNCTION public.trigger_award_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload json;
BEGIN
  -- Only trigger when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.client_phone IS NOT NULL THEN
    payload := json_build_object(
      'type', 'UPDATE',
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', json_build_object('status', OLD.status)
    );
    
    -- Call edge function
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/award-loyalty-points',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb,
      body := payload::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS award_loyalty_points_trigger ON public.appointments;
CREATE TRIGGER award_loyalty_points_trigger
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_award_loyalty_points();