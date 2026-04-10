-- Add payment_type column to payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'despesa';

-- Add tax_rate_percent column to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS tax_rate_percent numeric NOT NULL DEFAULT 6;