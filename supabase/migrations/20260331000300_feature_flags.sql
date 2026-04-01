-- Etapa 0: Criação da Tabela de Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE NOT NULL,
    orgao_id UUID REFERENCES public.orgaos(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Allow read access to authenticated users" 
ON public.feature_flags FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all access to service_role" 
ON public.feature_flags FOR ALL 
TO service_role 
USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
