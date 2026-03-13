-- Widen provider from enum to text so any bank/wallet name can be stored
ALTER TABLE public.transfer
  ALTER COLUMN provider TYPE text USING provider::text;

DROP TYPE public.transfer_provider;
