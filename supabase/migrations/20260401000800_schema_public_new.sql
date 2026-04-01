-- ==========================================
-- ETAPA 2 (CORRIGIDO): Redesenho do Banco (Baseline Schema)
-- SCHEMA: public_new
-- ==========================================

-- 1. Criação do Schema Isolado
CREATE SCHEMA IF NOT EXISTS public_new;

-- 2. Enums para Rigidez de Tipos
DO $$ BEGIN
    CREATE TYPE public_new.jornada_tipo AS ENUM ('normal', 'extra', 'noturno', 'sobreaviso');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public_new.tipo_ponto AS ENUM ('entrada', 'saida');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Tabela de Órgãos
CREATE TABLE IF NOT EXISTS public_new.orgaos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    sigla TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 4. Tabela de Unidades de Trabalho
CREATE TABLE IF NOT EXISTS public_new.unidades_trabalho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orgao_id UUID NOT NULL REFERENCES public_new.orgaos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    raio_metros INTEGER NOT NULL DEFAULT 200,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_unidades_orgao ON public_new.unidades_trabalho(orgao_id);

-- 5. Tabela de Colaboradores
CREATE TABLE IF NOT EXISTS public_new.colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orgao_id UUID NOT NULL REFERENCES public_new.orgaos(id) ON DELETE CASCADE,
    unidade_trabalho_id UUID REFERENCES public_new.unidades_trabalho(id) ON DELETE SET NULL,
    user_id UUID UNIQUE,
    nome_completo TEXT NOT NULL,
    matricula TEXT NOT NULL,
    cargo TEXT,
    jornada_entrada_manha TIME DEFAULT '08:00:00'::TIME,
    jornada_saida_manha TIME DEFAULT '12:00:00'::TIME,
    jornada_entrada_tarde TIME DEFAULT '14:00:00'::TIME,
    jornada_saida_tarde TIME DEFAULT '18:00:00'::TIME,
    geolocation_obrigatoria BOOLEAN DEFAULT FALSE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE(orgao_id, matricula)
);

CREATE INDEX IF NOT EXISTS idx_colaboradores_orgao_id ON public_new.colaboradores(orgao_id);

-- 6. Tabela de Registros de Ponto (Transacional)
CREATE TABLE IF NOT EXISTS public_new.registros_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orgao_id UUID REFERENCES public_new.orgaos(id) ON DELETE CASCADE, -- Nullable para órfãos
    colaborador_id UUID REFERENCES public_new.colaboradores(id) ON DELETE CASCADE, -- Nullable para órfãos
    data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
    timestamp_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo public_new.tipo_ponto NOT NULL,
    jornada_tipo public_new.jornada_tipo DEFAULT 'normal' NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    dentro_raio BOOLEAN,
    ip_address TEXT,
    
    -- Campos de Rastreabilidade de Inconsistência
    is_orphan BOOLEAN DEFAULT FALSE NOT NULL,
    orphan_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Constraint de Unicidade Robusta
    CONSTRAINT unique_ponto_colaborador_momento UNIQUE (colaborador_id, timestamp_registro, tipo),
    
    -- Garantia multi-tenant se não for órfão
    CONSTRAINT check_orgao_if_not_orphan CHECK (is_orphan = TRUE OR (orgao_id IS NOT NULL AND colaborador_id IS NOT NULL))
);

-- 7. ÍNDICES DE PERFORMANCE (DIRETRIZ FINAL)
-- Buscas por histórico do colaborador
CREATE INDEX IF NOT EXISTS idx_rp_colab_ts ON public_new.registros_ponto (colaborador_id, timestamp_registro DESC);
-- Buscas por Órgão e Período (Dashboards)
CREATE INDEX IF NOT EXISTS idx_rp_orgao_ts ON public_new.registros_ponto (orgao_id, timestamp_registro DESC);
-- Validação de alternância (Ponteiro principal do Trigger)
CREATE INDEX IF NOT EXISTS idx_rp_colab_tipo_ts ON public_new.registros_ponto (colaborador_id, tipo, timestamp_registro DESC);
-- Rastreio de órfãos
CREATE INDEX IF NOT EXISTS idx_rp_is_orphan ON public_new.registros_ponto (is_orphan) WHERE is_orphan = TRUE;
