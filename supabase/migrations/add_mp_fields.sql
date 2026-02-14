-- Add Mercado Pago fields to comercios table
ALTER TABLE public.comercios 
ADD COLUMN IF NOT EXISTS mp_subscription_id text,
ADD COLUMN IF NOT EXISTS mp_payer_id text,
ADD COLUMN IF NOT EXISTS mp_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS mp_external_reference text;

-- Add comment
COMMENT ON COLUMN public.comercios.mp_subscription_id IS 'ID de la suscripción (preapproval_id) en Mercado Pago';
COMMENT ON COLUMN public.comercios.mp_status IS 'Estado de la suscripción: active, paused, cancelled, pending';
