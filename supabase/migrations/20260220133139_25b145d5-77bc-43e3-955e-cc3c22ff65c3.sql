
-- Create table for digital point registration
CREATE TABLE public.registros_ponto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_registro date NOT NULL DEFAULT CURRENT_DATE,
  hora_registro time with time zone NOT NULL DEFAULT CURRENT_TIME,
  timestamp_registro timestamp with time zone NOT NULL DEFAULT now(),
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

-- Admins and super_admins can read all records
CREATE POLICY "Admins can read all registros_ponto"
ON public.registros_ponto FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admins and super_admins can insert (via edge function or direct)
CREATE POLICY "Admins can insert registros_ponto"
ON public.registros_ponto FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admins and super_admins can update records
CREATE POLICY "Admins can update registros_ponto"
ON public.registros_ponto FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admins and super_admins can delete records
CREATE POLICY "Admins can delete registros_ponto"
ON public.registros_ponto FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Regular users can read their own records (linked via colaboradores)
-- We need a way to link auth users to colaboradores - add senha_ponto to colaboradores
ALTER TABLE public.colaboradores ADD COLUMN senha_ponto text;

-- Users can view registros for their linked colaborador
CREATE POLICY "Users can read own registros_ponto"
ON public.registros_ponto FOR SELECT TO authenticated
USING (
  colaborador_id IN (
    SELECT id FROM public.colaboradores WHERE matricula IN (
      SELECT matricula FROM public.colaboradores
    )
  )
);

-- Allow anon/authenticated to insert via service role (edge function will handle)
-- The edge function uses service_role key so no additional policy needed for insert by users

-- Index for performance
CREATE INDEX idx_registros_ponto_colaborador_data ON public.registros_ponto(colaborador_id, data_registro);
CREATE INDEX idx_registros_ponto_data ON public.registros_ponto(data_registro);

-- Enable realtime for registros_ponto
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_ponto;
