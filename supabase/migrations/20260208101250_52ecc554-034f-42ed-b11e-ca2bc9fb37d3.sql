-- ==========================================
-- FIX SECURITY ISSUES: RLS Policies & Roles
-- ==========================================

-- 1. Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create SECURITY DEFINER function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only service role can manage roles"
ON public.user_roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==========================================
-- FIX: colaboradores table RLS
-- ==========================================
DROP POLICY IF EXISTS "Permitir leitura pública de colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Permitir inserção de colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Permitir atualização de colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Permitir exclusão de colaboradores" ON public.colaboradores;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read colaboradores"
ON public.colaboradores FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Only admins can insert
CREATE POLICY "Only admins can insert colaboradores"
ON public.colaboradores FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Only admins can update colaboradores"
ON public.colaboradores FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Only admins can delete colaboradores"
ON public.colaboradores FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- FIX: orgaos table RLS
-- ==========================================
DROP POLICY IF EXISTS "Permitir leitura pública de órgãos" ON public.orgaos;
DROP POLICY IF EXISTS "Permitir inserção de órgãos" ON public.orgaos;
DROP POLICY IF EXISTS "Permitir atualização de órgãos" ON public.orgaos;
DROP POLICY IF EXISTS "Permitir exclusão de órgãos" ON public.orgaos;

CREATE POLICY "Authenticated users can read orgaos"
ON public.orgaos FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert orgaos"
ON public.orgaos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update orgaos"
ON public.orgaos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete orgaos"
ON public.orgaos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- FIX: lotacoes table RLS
-- ==========================================
DROP POLICY IF EXISTS "Permitir leitura pública de lotações" ON public.lotacoes;
DROP POLICY IF EXISTS "Permitir inserção de lotações" ON public.lotacoes;
DROP POLICY IF EXISTS "Permitir atualização de lotações" ON public.lotacoes;
DROP POLICY IF EXISTS "Permitir exclusão de lotações" ON public.lotacoes;

CREATE POLICY "Authenticated users can read lotacoes"
ON public.lotacoes FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert lotacoes"
ON public.lotacoes FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update lotacoes"
ON public.lotacoes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete lotacoes"
ON public.lotacoes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- FIX: frequencias_geradas table RLS
-- ==========================================
DROP POLICY IF EXISTS "Permitir leitura pública de frequências" ON public.frequencias_geradas;
DROP POLICY IF EXISTS "Permitir inserção de frequências" ON public.frequencias_geradas;
DROP POLICY IF EXISTS "Permitir atualização de frequências" ON public.frequencias_geradas;
DROP POLICY IF EXISTS "Permitir exclusão de frequências" ON public.frequencias_geradas;

CREATE POLICY "Authenticated users can read frequencias"
ON public.frequencias_geradas FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert frequencias"
ON public.frequencias_geradas FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update frequencias"
ON public.frequencias_geradas FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete frequencias"
ON public.frequencias_geradas FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- FIX: Storage bucket policies
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can upload signed sheets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view signed sheets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their signed sheets" ON storage.objects;

CREATE POLICY "Only admins can upload signed sheets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'folhas-assinadas' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can view signed sheets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'folhas-assinadas' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete signed sheets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'folhas-assinadas' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update signed sheets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'folhas-assinadas' AND
  public.has_role(auth.uid(), 'admin')
);