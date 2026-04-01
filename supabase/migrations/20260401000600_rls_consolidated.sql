-- Migration 06: RLS Consolidado (Segurança Padrão)
-- Reversível: Recriar policies anteriores conforme backup

-- 1. Desabilitar Policies Legadas (Cleanup Seguro)
DROP POLICY IF EXISTS "Authenticated users can read colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only admins can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only admins can update colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only admins can delete colaboradores" ON public.colaboradores;

-- 2. POLICIES PARA: colaboradores
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colaboradores_select" ON public.colaboradores FOR SELECT TO authenticated
USING (true); -- Qualquer autenticado pode ver (baseline atual para não quebrar UI)

CREATE POLICY "colaboradores_insert" ON public.colaboradores FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "colaboradores_update" ON public.colaboradores FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "colaboradores_delete" ON public.colaboradores FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 3. POLICIES PARA: registros_ponto
DROP POLICY IF EXISTS "Usuarios podem ler seus proprios pontos" ON public.registros_ponto;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registros_ponto_select" ON public.registros_ponto FOR SELECT TO authenticated
USING (colaborador_id IN (SELECT id FROM public.colaboradores WHERE user_id = auth.uid()) 
       OR public.has_role(auth.uid(), 'admin') 
       OR public.has_role(auth.uid(), 'super_admin')
       OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "registros_ponto_insert" ON public.registros_ponto FOR INSERT TO authenticated
WITH CHECK (colaborador_id IN (SELECT id FROM public.colaboradores WHERE user_id = auth.uid())
            OR public.has_role(auth.uid(), 'admin')
            OR public.has_role(auth.uid(), 'super_admin'));

-- 4. POLICIES PARA: unidades_trabalho
ALTER TABLE public.unidades_trabalho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unidades_trabalho_select" ON public.unidades_trabalho FOR SELECT TO authenticated
USING (true);

CREATE POLICY "unidades_trabalho_all_admin" ON public.unidades_trabalho FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
