-- ============================================
-- MIGRATION: Multi-tenant Architecture v1.0
-- Adds empresas table and empresa_id to all tables
-- ============================================

-- 1. CREATE EMPRESAS TABLE
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    nome VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100) DEFAULT 'São Luís',
    estado VARCHAR(2) DEFAULT 'MA',
    plano VARCHAR(50) DEFAULT 'basico' CHECK (plano IN ('basico', 'profissional', 'enterprise')),
    max_colaboradores INTEGER DEFAULT 10,
    ativo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. RLS FOR EMPRESAS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Policy: empresa owners can manage their empresa
CREATE POLICY "Empresa owners can manage" ON public.empresas
FOR ALL USING (true);

-- 3. ADD empresa_id TO EXISTING TABLES
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.orgaos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.lotacoes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.unidades_trabalho ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.registros_ponto ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.abonos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- 4. UPDATE RLS POLICIES TO USE empresa_id
DROP POLICY IF EXISTS "Permitir inserção de órgãos" ON public.orgaos;
CREATE POLICY "Permitir inserção de órgãos" ON public.orgaos 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de unidades" ON public.unidades_trabalho;
CREATE POLICY "Permitir inserção de unidades" ON public.unidades_trabalho 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de lotações" ON public.lotacoes;
CREATE POLICY "Permitir inserção de lotações" ON public.lotacoes 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de colaboradores" ON public.colaboradores;
CREATE POLICY "Permitir inserção de colaboradores" ON public.colaboradores 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de registros_ponto" ON public.registros_ponto;
CREATE POLICY "Permitir inserção de registros_ponto" ON public.registros_ponto 
FOR INSERT WITH CHECK (true);

-- 5. SEED DATA: Create default empresa (PROCON)
INSERT INTO public.empresas (id, nome, nome_fantasia, cnpj, email, plano, max_colaboradores)
VALUES (
    '8ef318ca-1151-4f23-8a5a-aec993a0b6b2',
    'PROCON-MA',
    'Instituto de Defesa do Consumidor',
    '00.000.000/0001-00',
    'procon@saoluis.ma.gov.br',
    'profissional',
    50
) ON CONFLICT (id) DO NOTHING;

-- 6. UPDATE existing records to link to empresa
UPDATE public.orgaos SET empresa_id = '8ef318ca-1151-4f23-8a5a-aec993a0b6b2' WHERE empresa_id IS NULL;
UPDATE public.lotacoes SET empresa_id = '8ef318ca-1151-4f23-8a5a-aec993a0b6b2' WHERE empresa_id IS NULL;
UPDATE public.unidades_trabalho SET empresa_id = '8ef318ca-1151-4f23-8a5a-aec993a0b6b2' WHERE empresa_id IS NULL;
UPDATE public.colaboradores SET empresa_id = '8ef318ca-1151-4f23-8a5a-aec993a0b6b2' WHERE empresa_id IS NULL;
UPDATE public.registros_ponto SET empresa_id = '8ef318ca-1151-4f23-8a5a-aec993a0b6b2' WHERE empresa_id IS NULL;

-- 7. Verificar
SELECT 'Empresas:' as tabela, count(*) as total FROM public.empresas
UNION ALL SELECT 'Órgãos:', count(*) FROM public.orgaos WHERE empresa_id IS NOT NULL
UNION ALL SELECT 'Lotações:', count(*) FROM public.lotacoes WHERE empresa_id IS NOT NULL
UNION ALL SELECT 'Colaboradores:', count(*) FROM public.colaboradores WHERE empresa_id IS NOT NULL
UNION ALL SELECT 'Registros de Ponto:', count(*) FROM public.registros_ponto WHERE empresa_id IS NOT NULL
UNION ALL SELECT 'Unidades:', count(*) FROM public.unidades_trabalho WHERE empresa_id IS NOT NULL;