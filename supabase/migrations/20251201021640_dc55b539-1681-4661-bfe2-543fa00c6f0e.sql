-- Add W-API credentials columns to shops table
ALTER TABLE public.shops 
ADD COLUMN wapi_instance_id TEXT,
ADD COLUMN wapi_token TEXT;