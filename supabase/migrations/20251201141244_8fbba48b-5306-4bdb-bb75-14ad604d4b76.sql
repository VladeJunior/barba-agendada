-- Create subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('essencial', 'profissional', 'elite');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');

-- Add subscription columns to shops table
ALTER TABLE public.shops 
ADD COLUMN plan subscription_plan DEFAULT 'essencial',
ADD COLUMN subscription_status subscription_status DEFAULT 'active',
ADD COLUMN trial_ends_at TIMESTAMPTZ,
ADD COLUMN current_period_ends_at TIMESTAMPTZ,
ADD COLUMN payment_provider TEXT,
ADD COLUMN payment_customer_id TEXT,
ADD COLUMN payment_subscription_id TEXT;