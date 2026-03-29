-- Create gestor_unidades table
CREATE TABLE IF NOT EXISTS public.gestor_unidades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unidade_trabalho_id uuid NOT NULL REFERENCES public.unidades_trabalho(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, unidade_trabalho_id)
);

-- Enable RLS
ALTER TABLE public.gestor_unidades ENABLE ROW LEVEL SECURITY;

-- Policies for gestor_unidades
CREATE POLICY "Gestores podem ver suas próprias unidades"
    ON public.gestor_unidades
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins e Super Admins podem gerenciar gestor_unidades"
    ON public.gestor_unidades
    FOR ALL
    TO authenticated
    USING (public.has_role('super_admin', auth.uid()) OR public.has_role('admin', auth.uid()));

-- Update RLS for colaboradores to allow gestores to see their employees
CREATE POLICY "Gestores podem ver colaboradores de suas unidades"
    ON public.colaboradores
    FOR SELECT
    TO authenticated
    USING (
        public.has_role('gestor', auth.uid()) AND 
        unidade_trabalho_id IN (
            SELECT unidade_trabalho_id 
            FROM public.gestor_unidades 
            WHERE user_id = auth.uid()
        )
    );

-- Update RLS for registros_ponto to allow gestores to see points of their employees
CREATE POLICY "Gestores podem ver registros de colaboradores de suas unidades"
    ON public.registros_ponto
    FOR SELECT
    TO authenticated
    USING (
        public.has_role('gestor', auth.uid()) AND 
        colaborador_id IN (
            SELECT id 
            FROM public.colaboradores 
            WHERE unidade_trabalho_id IN (
                SELECT unidade_trabalho_id 
                FROM public.gestor_unidades 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Also give gestores permission to view orgaos, lotacoes and unidades_trabalho if they don't have it generally
-- (Assuming they might already be able to view, but just in case, we could specify. Usually org/lot/und rules are public read for authenticated).
