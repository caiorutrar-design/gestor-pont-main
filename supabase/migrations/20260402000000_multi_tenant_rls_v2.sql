-- ############################################################
-- # ARQUITETURA MULTI-TENANT: Row Level Security (RLS)
-- ############################################################

-- 1. Funções Auxiliares de Segurança (Security Definer)
-- Elas rodam com privilégios de sistema para ler tabelas de roles
CREATE OR REPLACE FUNCTION public.get_auth_orgao_id()
RETURNS uuid 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT orgao_id FROM public.colaboradores WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Habilitação de RLS em Massa
ALTER TABLE public.orgaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para ORGAOS
DROP POLICY IF EXISTS "Usuários veem apenas seu próprio órgão" ON public.orgaos;
CREATE POLICY "Usuários veem apenas seu próprio órgão" ON public.orgaos
  FOR SELECT 
  USING (id = public.get_auth_orgao_id() OR public.get_auth_role() = 'super_admin');

-- 4. Políticas para UNIDADES_TRABALHO
DROP POLICY IF EXISTS "Isolamento por órgão nas unidades" ON public.unidades_trabalho;
CREATE POLICY "Isolamento por órgão nas unidades" ON public.unidades_trabalho
  FOR SELECT 
  USING (orgao_id = public.get_auth_orgao_id() OR public.get_auth_role() = 'super_admin');

-- 5. Políticas para COLABORADORES
DROP POLICY IF EXISTS "Acesso por órgão e individual para colaboradores" ON public.colaboradores;
CREATE POLICY "Acesso por órgão e individual para colaboradores" ON public.colaboradores
  FOR SELECT 
  USING (
    orgao_id = public.get_auth_orgao_id() -- Admins/Gestores do mesmo órgão
    OR user_id = auth.uid()              -- O próprio colaborador
    OR public.get_auth_role() = 'super_admin'
  );

-- 6. Políticas para REGISTROS_PONTO (CRÍTICO)
-- Colaborador: Vê o dele
-- Admin/RH: Vê todos do órgão
-- Super Admin: Vê tudo
DROP POLICY IF EXISTS "Isolamento multi-tenant registros de ponto" ON public.registros_ponto;
CREATE POLICY "Isolamento multi-tenant registros de ponto" ON public.registros_ponto
  FOR SELECT 
  USING (
    (public.get_auth_role() IN ('admin', 'gestor') AND orgao_id = public.get_auth_orgao_id())
    OR (colaborador_id = (SELECT id FROM colaboradores WHERE user_id = auth.uid()))
    OR (public.get_auth_role() = 'super_admin')
  );

-- Política de Inserção (Apenas via Service Role na Edge Function ou via owner)
-- No nosso caso, a Edge Function usa bypass RLS (Service Role), 
-- mas deixamos aqui por segurança caso mudemos.

COMMENT ON FUNCTION public.get_auth_orgao_id() IS 'Retorna o orgao_id do usuário logado baseado na tabela colaboradores.';
COMMENT ON FUNCTION public.get_auth_role() IS 'Retorna o papel do usuário logado baseado na tabela user_roles.';
