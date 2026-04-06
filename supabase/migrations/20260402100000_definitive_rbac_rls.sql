-- ############################################################
-- # RBAC & MULTI-TENANT ISOLATION (DEFINITIVE VERSION)
-- ############################################################

-- 1. Helper Functions (Security Definer)
-- ------------------------------------------------------------

-- Retorna o orgao_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_auth_orgao_id()
RETURNS uuid 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT orgao_id FROM public.colaboradores WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Retorna o papel do usuário na tabela user_roles
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Retorna IDs das unidades que o usuário gerencia (se for gestor)
CREATE OR REPLACE FUNCTION public.get_auth_managed_unidades()
RETURNS uuid[] 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
AS $$
BEGIN
  RETURN ARRAY(SELECT unidade_id FROM public.gestores_unidades WHERE user_id = auth.uid());
END;
$$;

-- 2. Ativação de RLS
-- ------------------------------------------------------------
ALTER TABLE public.orgaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para UNIDADES_TRABALHO (Compartimentadas)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC Unidades" ON public.unidades_trabalho;
CREATE POLICY "RBAC Unidades" ON public.unidades_trabalho
  FOR SELECT 
  USING (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'admin' AND orgao_id = public.get_auth_orgao_id())
    OR (public.get_auth_role() = 'gestor' AND id = ANY(public.get_auth_managed_unidades()))
    OR (id = (SELECT lotacao_id FROM public.colaboradores WHERE user_id = auth.uid()))
  );

-- 4. Políticas para COLABORADORES (Visão Granular)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC Colaboradores" ON public.colaboradores;
CREATE POLICY "RBAC Colaboradores" ON public.colaboradores
  FOR SELECT 
  USING (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'admin' AND orgao_id = public.get_auth_orgao_id())
    OR (public.get_auth_role() = 'gestor' AND lotacao_id = ANY(public.get_auth_managed_unidades()))
    OR (user_id = auth.uid())
  );

-- 5. Políticas para REGISTROS_PONTO (CRÍTICO)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC Registros Ponto" ON public.registros_ponto;
CREATE POLICY "RBAC Registros Ponto" ON public.registros_ponto
  FOR SELECT 
  USING (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'admin' AND orgao_id = public.get_auth_orgao_id())
    OR (
      public.get_auth_role() = 'gestor' 
      AND orgao_id = public.get_auth_orgao_id()
      AND (SELECT lotacao_id FROM public.colaboradores WHERE id = public.registros_ponto.colaborador_id) = ANY(public.get_auth_managed_unidades())
    )
    OR (colaborador_id = (SELECT id FROM public.colaboradores WHERE user_id = auth.uid()))
  );

-- 6. Política de Inserção de Registros
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir inserção de registros" ON public.registros_ponto;
CREATE POLICY "Permitir inserção de registros" ON public.registros_ponto
  FOR INSERT
  WITH CHECK (
    -- Apenas se for o próprio colaborador OU se for admin do órgão
    colaborador_id = (SELECT id FROM public.colaboradores WHERE user_id = auth.uid())
    OR (public.get_auth_role() = 'admin' AND orgao_id = public.get_auth_orgao_id())
  );

-- ############################################################
-- # FIM DO MODELO DE SEGURANÇA DEFINITIVO
-- ############################################################
