
-- Create abonos table
CREATE TABLE public.abonos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_abono date NOT NULL,
  motivo text NOT NULL,
  concedido_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abonos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage abonos" ON public.abonos FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Gestores can read abonos" ON public.abonos FOR SELECT
  USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestores can insert abonos" ON public.abonos FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role));

-- Create justificativas table
CREATE TABLE public.justificativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_falta date NOT NULL,
  descricao text NOT NULL,
  anexo_url text,
  anexo_nome text,
  registrado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.justificativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage justificativas" ON public.justificativas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Gestores can read justificativas" ON public.justificativas FOR SELECT
  USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestores can insert justificativas" ON public.justificativas FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role));

CREATE TRIGGER update_justificativas_updated_at
  BEFORE UPDATE ON public.justificativas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create ferias table
CREATE TYPE public.tipo_ferias AS ENUM ('ferias_anuais', 'ferias_premio', 'licenca', 'recesso');

CREATE TABLE public.ferias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  tipo tipo_ferias NOT NULL DEFAULT 'ferias_anuais',
  observacao text,
  aprovado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ferias" ON public.ferias FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Gestores can read ferias" ON public.ferias FOR SELECT
  USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestores can insert ferias" ON public.ferias FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role));

-- Storage bucket for justificativa attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('justificativas-anexos', 'justificativas-anexos', false);

CREATE POLICY "Admins and gestores can upload anexos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'justificativas-anexos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role)));

CREATE POLICY "Admins and gestores can read anexos" ON storage.objects FOR SELECT
  USING (bucket_id = 'justificativas-anexos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role)));

CREATE POLICY "Admins can delete anexos" ON storage.objects FOR DELETE
  USING (bucket_id = 'justificativas-anexos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

-- Allow gestores to read audit_logs
CREATE POLICY "Gestores can read audit_logs" ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'gestor'::app_role));

-- Allow all authenticated to insert audit_logs (for logging actions)
CREATE POLICY "Authenticated users can insert audit_logs" ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
