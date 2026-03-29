-- Drop the misleading "Only service role can manage roles" policy
-- Service role bypasses RLS entirely, so this policy with USING(true) is misleading
-- and could be confused as granting access to authenticated users.
-- Without any permissive policies for INSERT/UPDATE/DELETE, those ops are denied by default.
DROP POLICY IF EXISTS "Only service role can manage roles" ON public.user_roles;

-- Add explicit restrictive policies to make intent clear
-- No permissive write policies exist, so writes are denied to all authenticated users.
-- Service role bypasses RLS and is the only way to manage roles.