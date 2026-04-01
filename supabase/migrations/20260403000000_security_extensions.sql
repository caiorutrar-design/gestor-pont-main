-- ############################################################
-- # HARDENING: Geolocalização e Segurança de Rede
-- ############################################################

-- 1. Extensão de UNIDADES_TRABALHO (Geofencing)
ALTER TABLE public.unidades_trabalho 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS raio_permitido integer DEFAULT 200; -- Raio padrão: 200 metros

COMMENT ON COLUMN public.unidades_trabalho.raio_permitido IS 'Distância máxima permitida para batida de ponto nesta unidade (em metros).';

-- 2. Extensão de ORGAOS (IP Intelligence)
ALTER TABLE public.orgaos
ADD COLUMN IF NOT EXISTS ip_whitelist text[] DEFAULT '{}';

COMMENT ON COLUMN public.orgaos.ip_whitelist IS 'Lista de endereços IP ou faixas CIDR permitidas para registro de ponto.';

-- 3. Tabela de Rate Limit (Distributed Lock)
-- Usamos o Postgres como mecanismo de lock rápido para evitar "Double Tap"
CREATE TABLE IF NOT EXISTS public.ponto_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  last_request_at timestamptz DEFAULT now()
);

-- Habilitar RLS (Apenas para garantir que ninguém acessa via API)
ALTER TABLE public.ponto_rate_limits ENABLE ROW LEVEL SECURITY;

-- Index para geolocalização rápida (se usássemos PostGIS, mas aqui são colunas simples)
CREATE INDEX IF NOT EXISTS idx_unidades_coords ON public.unidades_trabalho(latitude, longitude) WHERE latitude IS NOT NULL;
