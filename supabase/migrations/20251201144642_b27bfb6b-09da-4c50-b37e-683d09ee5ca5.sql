-- Add column to track if user has selected a plan (alternative to enum value)
-- Existing shops have already selected a plan, so default is TRUE
-- New shops will have this set to FALSE until they select a plan
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS has_selected_plan boolean DEFAULT true;