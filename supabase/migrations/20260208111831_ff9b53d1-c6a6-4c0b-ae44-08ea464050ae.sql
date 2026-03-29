-- Fix colaboradores SELECT policy to only allow admins to read
-- Drop the existing permissive policy that allows all authenticated users
DROP POLICY IF EXISTS "Authenticated users can read colaboradores" ON public.colaboradores;

-- Create a new policy that only allows admins to read colaboradores
CREATE POLICY "Only admins can read colaboradores"
ON public.colaboradores
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));