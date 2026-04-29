-- ============================================
-- TRANSACOES TABLE for Gestor de Ponto
-- Run in Supabase Dashboard > SQL Editor
-- ============================================

-- Create transacoes table
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    data DATE NOT NULL DEFAULT current_date,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    pago_por VARCHAR(255),
    empresa_id UUID REFERENCES public.empresas(id),
    observacoes TEXT
);

-- RLS
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Policy: allow all for now
CREATE POLICY "Allow all" ON public.transacoes FOR ALL USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa_data ON public.transacoes(empresa_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON public.transacoes(categoria);

-- Seed with some sample data
INSERT INTO public.transacoes (data, descricao, categoria, valor, tipo, pago_por, empresa_id)
VALUES 
    ('2026-04-01', 'CloudWalk - Projeto Thales', 'freelance', 3500.00, 'entrada', 'CloudWalk', '8ef318ca-1151-4f23-8a5a-aec993a0b6b2'),
    ('2026-04-05', 'Elvaci - Manutenção', 'freelance', 2800.00, 'entrada', 'Elvaci', '8ef318ca-1151-4f23-8a5a-aec993a0b6b2'),
    ('2026-04-10', 'Salário PROCON', 'salario', 4921.52, 'entrada', 'PROCON-MA', '8ef318ca-1151-4f23-8a5a-aec993a0b6b2'),
    ('2026-04-15', 'Aluguel', 'moradia', 1500.00, 'saida', 'Proprietário', '8ef318ca-1151-4f23-8a5a-aec993a0b6b2'),
    ('2026-04-20', 'Supermercado', 'alimentacao', 850.00, 'saida', 'Mercado', '8ef318ca-1151-4f23-8a5a-aec993a0b6b2'),
    ('2026-04-22', 'Freelance Avulso', 'freelance', 1500.00, 'entrada', 'Rafael Portelada', '8ef318ca-1151-4f23-8a5a-aec993a0b6b2')
ON CONFLICT DO NOTHING;

-- Verify
SELECT count(*) as total_transacoes FROM public.transacoes;