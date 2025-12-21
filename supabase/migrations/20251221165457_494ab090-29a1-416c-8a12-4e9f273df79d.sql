-- Add whatsapp_bot_enabled column to shops table
ALTER TABLE public.shops 
ADD COLUMN whatsapp_bot_enabled BOOLEAN DEFAULT false;