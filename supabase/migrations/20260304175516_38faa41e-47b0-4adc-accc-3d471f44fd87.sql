
-- Add user_id to colaboradores to link with auth.users
ALTER TABLE public.colaboradores ADD COLUMN user_id uuid;

-- Drop the broken "Users can read own registros_ponto" policy
DROP POLICY IF EXISTS "Users can read own registros_ponto" ON public.registros_ponto;

-- Colaborador can read their own record via user_id
CREATE POLICY "Colaborador can read own record"
ON public.colaboradores
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Colaborador can read their own registros_ponto
CREATE POLICY "Colaborador can read own registros"
ON public.registros_ponto
FOR SELECT
TO authenticated
USING (colaborador_id IN (
  SELECT id FROM public.colaboradores WHERE user_id = auth.uid()
));

-- Colaborador can insert their own registros_ponto
CREATE POLICY "Colaborador can insert own registros"
ON public.registros_ponto
FOR INSERT
TO authenticated
WITH CHECK (colaborador_id IN (
  SELECT id FROM public.colaboradores WHERE user_id = auth.uid()
));
