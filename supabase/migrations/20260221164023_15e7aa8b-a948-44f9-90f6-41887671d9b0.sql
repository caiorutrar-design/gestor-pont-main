
-- Fix unique constraint: one role per user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Gestor RLS policies
CREATE POLICY "Gestores can read registros_ponto"
ON public.registros_ponto FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestores can read colaboradores"
ON public.colaboradores FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestores can read orgaos"
ON public.orgaos FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestores can read lotacoes"
ON public.lotacoes FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Allow admins/super_admins to view all roles (for user management)
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
