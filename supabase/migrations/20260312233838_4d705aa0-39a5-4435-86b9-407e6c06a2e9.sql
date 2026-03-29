
-- Create unidades_trabalho table
CREATE TABLE public.unidades_trabalho (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  raio_metros integer NOT NULL DEFAULT 200,
  orgao_id uuid NOT NULL REFERENCES public.orgaos(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unidades_trabalho ENABLE ROW LEVEL SECURITY;

-- RLS policies for unidades_trabalho
CREATE POLICY "Admins and super_admins can manage unidades_trabalho" ON public.unidades_trabalho
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can read unidades_trabalho" ON public.unidades_trabalho
  FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Gestores can read unidades_trabalho" ON public.unidades_trabalho
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'gestor'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_unidades_trabalho_updated_at
  BEFORE UPDATE ON public.unidades_trabalho
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add geolocation columns to colaboradores
ALTER TABLE public.colaboradores
  ADD COLUMN unidade_trabalho_id uuid REFERENCES public.unidades_trabalho(id) ON DELETE SET NULL,
  ADD COLUMN geolocation_obrigatoria boolean NOT NULL DEFAULT false;

-- Add geolocation columns to registros_ponto
ALTER TABLE public.registros_ponto
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN dentro_raio boolean;
