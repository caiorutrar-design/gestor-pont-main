-- ############################################################
-- # EXTENSÃO DE RLS: Tabelas Auxiliares e Módulos Adicionais
-- ############################################################

-- 1. Habilitação de RLS nas tabelas remanescentes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.justificativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias_geradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY; -- Legacy (unidades)

-- 2. Políticas para PROFILES
-- Usuário vê o dele. Admin vê do órgão.
DROP POLICY IF EXISTS "Acesso multi-tenant profiles" ON public.profiles;
CREATE POLICY "Acesso multi-tenant profiles" ON public.profiles
  FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR orgao_id = public.get_auth_orgao_id()
    OR public.get_auth_role() = 'super_admin'
  );

-- 3. Políticas para USER_ROLES
-- Usuário vê o dele. Admin vê do órgão.
DROP POLICY IF EXISTS "Acesso multi-tenant user_roles" ON public.user_roles;
CREATE POLICY "Acesso multi-tenant user_roles" ON public.user_roles
  FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR (SELECT orgao_id FROM public.colaboradores WHERE user_id = public.user_roles.user_id) = public.get_auth_orgao_id()
    OR public.get_auth_role() = 'super_admin'
  );

-- 4. Políticas para AUDIT_LOGS
-- Apenas visualização por Admin do mesmo órgão ou Super Admin.
DROP POLICY IF EXISTS "Isolamento audit_logs por orgao" ON public.audit_logs;
CREATE POLICY "Isolamento audit_logs por orgao" ON public.audit_logs
  FOR SELECT 
  USING (
    (SELECT orgao_id FROM public.colaboradores WHERE user_id = public.audit_logs.user_id) = public.get_auth_orgao_id()
    OR public.get_auth_role() = 'super_admin'
  );

-- 5. Módulos de Ausências (Abonos, Justificativas, Ferias)
-- Colaborador: Vê o dele.
-- Admin/RH: Vê todos do órgão.
DROP POLICY IF EXISTS "Isolamento abonos por orgao e dono" ON public.abonos;
CREATE POLICY "Isolamento abonos por orgao e dono" ON public.abonos
  FOR SELECT 
  USING (
    colaborador_id IN (SELECT id FROM colaboradores WHERE user_id = auth.uid())
    OR (SELECT orgao_id FROM colaboradores WHERE id = public.abonos.colaborador_id) = public.get_auth_orgao_id()
    OR public.get_auth_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "Isolamento justificativas por orgao e dono" ON public.justificativas;
CREATE POLICY "Isolamento justificativas por orgao e dono" ON public.justificativas
  FOR SELECT 
  USING (
    colaborador_id IN (SELECT id FROM colaboradores WHERE user_id = auth.uid())
    OR (SELECT orgao_id FROM colaboradores WHERE id = public.justificativas.colaborador_id) = public.get_auth_orgao_id()
    OR public.get_auth_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "Isolamento ferias por orgao e dono" ON public.ferias;
CREATE POLICY "Isolamento ferias por orgao e dono" ON public.ferias
  FOR SELECT 
  USING (
    colaborador_id IN (SELECT id FROM colaboradores WHERE user_id = auth.uid())
    OR (SELECT orgao_id FROM colaboradores WHERE id = public.ferias.colaborador_id) = public.get_auth_orgao_id()
    OR public.get_auth_role() = 'super_admin'
  );

-- 6. Tabelas Legadas / Cache (Lotações, Frequências)
DROP POLICY IF EXISTS "Isolamento lotacoes por orgao" ON public.lotacoes;
CREATE POLICY "Isolamento lotacoes por orgao" ON public.lotacoes
  FOR SELECT 
  USING (orgao_id = public.get_auth_orgao_id() OR public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Isolamento frequencias_geradas por orgao" ON public.frequencias_geradas;
CREATE POLICY "Isolamento frequencias_geradas por orgao" ON public.frequencias_geradas
  FOR SELECT 
  USING (
    colaborador_id IN (SELECT id FROM colaboradores WHERE user_id = auth.uid())
    OR (SELECT orgao_id FROM colaboradores WHERE id = public.frequencias_geradas.colaborador_id) = public.get_auth_orgao_id()
    OR public.get_auth_role() = 'super_admin'
  );

-- ############################################################
-- # FIM DA EXTENSÃO DE RLS
-- ############################################################
