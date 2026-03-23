-- RPC for soft-deleting a transfer. Runs as SECURITY DEFINER to bypass the SELECT
-- RLS policy (which requires active=true) on the updated row. Permission checks are
-- done manually: caller must be an admin in the same business as the transfer's branch.
CREATE OR REPLACE FUNCTION public.delete_transfer(p_transfer_id uuid)
RETURNS void AS $$
DECLARE
  v_bu RECORD;
  v_transfer RECORD;
BEGIN
  SELECT bu.id, bu.business_id, bu.role INTO v_bu
  FROM public.business_user bu
  WHERE bu.user_id = auth.uid() AND bu.active = true
  LIMIT 1;

  IF v_bu IS NULL OR v_bu.role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete transfers';
  END IF;

  SELECT t.* INTO v_transfer
  FROM public.transfer t
  WHERE t.id = p_transfer_id AND t.active = true;

  IF v_transfer IS NULL THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.branch b
    WHERE b.id = v_transfer.branch_id AND b.business_id = v_bu.business_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.transfer SET active = false WHERE id = p_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
