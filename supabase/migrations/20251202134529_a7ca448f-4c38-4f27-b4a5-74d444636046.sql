-- Drop existing trigger first
DROP TRIGGER IF EXISTS award_loyalty_points_trigger ON public.appointments;

-- Recreate the function with hardcoded URL
CREATE OR REPLACE FUNCTION public.trigger_award_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Call edge function with hardcoded URL
    PERFORM net.http_post(
      url := 'https://pyizjlioocxfjvnosxqy.supabase.co/functions/v1/award-loyalty-points',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5aXpqbGlvb2N4Zmp2bm9zeHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Mjg3NjUsImV4cCI6MjA4MDEwNDc2NX0.vkiQATixB1yRtxIA0TJ_tu5XAzMaa-7HqOORZ604IIk'
      )::jsonb,
      body := payload::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER award_loyalty_points_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_award_loyalty_points();