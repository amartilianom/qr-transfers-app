-- Fix invite SELECT policy: previously any authenticated user could read all invites.
-- Now only unclaimed, non-expired invites are readable (e.g. during onboarding flow).
DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.invite;

CREATE POLICY "Anyone can read unclaimed unexpired invite by token"
  ON public.invite FOR SELECT
  USING (
    claimed_by IS NULL
    AND expires_at > now()
    AND auth.uid() IS NOT NULL
  );
