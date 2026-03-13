-- Allow admins to soft-delete (update active=false) any transfer in their branches,
-- not just the ones they created.
CREATE POLICY "Admins can update any transfer in their branches"
  ON public.transfer FOR UPDATE
  USING (
    branch_id = ANY(public.my_branch_ids())
    AND EXISTS (
      SELECT 1 FROM public.my_business_user() mbu WHERE mbu.role = 'admin'
    )
  );
