
-- 1. Assign super_admin role to caiorutrar@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('0129754d-0ab9-4d88-87c4-e42992cc2109', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action_type text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and super_admins can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- 3. Update colaboradores RLS
DROP POLICY IF EXISTS "Only admins can insert colaboradores" ON public.colaboradores;
CREATE POLICY "Admins and super_admins can insert colaboradores"
  ON public.colaboradores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can update colaboradores" ON public.colaboradores;
CREATE POLICY "Admins and super_admins can update colaboradores"
  ON public.colaboradores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can delete colaboradores" ON public.colaboradores;
CREATE POLICY "Admins and super_admins can delete colaboradores"
  ON public.colaboradores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can read colaboradores" ON public.colaboradores;
CREATE POLICY "Admins and super_admins can read colaboradores"
  ON public.colaboradores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 4. Update orgaos RLS
DROP POLICY IF EXISTS "Only admins can insert orgaos" ON public.orgaos;
CREATE POLICY "Admins and super_admins can insert orgaos"
  ON public.orgaos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can update orgaos" ON public.orgaos;
CREATE POLICY "Admins and super_admins can update orgaos"
  ON public.orgaos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can delete orgaos" ON public.orgaos;
CREATE POLICY "Admins and super_admins can delete orgaos"
  ON public.orgaos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 5. Update lotacoes RLS
DROP POLICY IF EXISTS "Only admins can insert lotacoes" ON public.lotacoes;
CREATE POLICY "Admins and super_admins can insert lotacoes"
  ON public.lotacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can update lotacoes" ON public.lotacoes;
CREATE POLICY "Admins and super_admins can update lotacoes"
  ON public.lotacoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can delete lotacoes" ON public.lotacoes;
CREATE POLICY "Admins and super_admins can delete lotacoes"
  ON public.lotacoes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 6. Update frequencias_geradas RLS
DROP POLICY IF EXISTS "Only admins can insert frequencias" ON public.frequencias_geradas;
CREATE POLICY "Admins and super_admins can insert frequencias"
  ON public.frequencias_geradas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can update frequencias" ON public.frequencias_geradas;
CREATE POLICY "Admins and super_admins can update frequencias"
  ON public.frequencias_geradas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Only admins can delete frequencias" ON public.frequencias_geradas;
CREATE POLICY "Admins and super_admins can delete frequencias"
  ON public.frequencias_geradas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 7. Super admins can manage user_roles
CREATE POLICY "Super admins can insert user roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update user roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete user roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 8. Super admins and admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
