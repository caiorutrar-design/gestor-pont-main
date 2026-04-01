-- Migration 01: Estabilização de Unidades de Trabalho
-- Reversível: DROP TABLE public.unidades_trabalho (apenas se criada aqui)

-- 1. Criação/Garantia da tabela
CREATE TABLE IF NOT EXISTS public.unidades_trabalho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    raio_metros INTEGER NOT NULL DEFAULT 200,
    orgao_id UUID REFERENCES public.orgaos(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dados Default (Sede Administrativa) se a tabela estiver vazia
INSERT INTO public.unidades_trabalho (nome, latitude, longitude, raio_metros, orgao_id)
SELECT 'Sede Administrativa (Default)', 0.0, 0.0, 1000, id
FROM public.orgaos
WHERE NOT EXISTS (SELECT 1 FROM public.unidades_trabalho)
LIMIT 1;

-- 3. Habilitar RLS (caso não esteja)
ALTER TABLE public.unidades_trabalho ENABLE ROW LEVEL SECURITY;

-- 4. Comentários para documentação
COMMENT ON TABLE public.unidades_trabalho IS 'Unidades físicas de trabalho para validação de geofencing.';
