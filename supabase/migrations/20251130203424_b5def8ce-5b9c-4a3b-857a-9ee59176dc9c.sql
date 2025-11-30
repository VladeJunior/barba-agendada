-- Function to check for overlapping appointments
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Skip check if appointment is being cancelled
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Check for overlapping appointments for the same barber
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE barber_id = NEW.barber_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time)
        OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
        OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Já existe um agendamento neste horário para este barbeiro';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for insert and update
DROP TRIGGER IF EXISTS check_appointment_overlap_trigger ON public.appointments;
CREATE TRIGGER check_appointment_overlap_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_appointment_overlap();