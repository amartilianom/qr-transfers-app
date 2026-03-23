-- Admins need to read all branch assignments in their business
-- (to display and manage them in the team screen)
CREATE POLICY "Admins see all branch assignments"
  ON public.business_user_branch FOR SELECT
  USING (
    business_user_id IN (
      SELECT bu2.id FROM public.business_user bu2
      INNER JOIN public.my_business_user() my_bu ON my_bu.business_id = bu2.business_id
      WHERE my_bu.role = 'admin'
    )
  );
