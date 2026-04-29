-- ============================================
-- B2B PAYMENTS TABLE for Gestor de Ponto
-- Run in Supabase Dashboard > SQL Editor
-- ============================================

-- Create pagamentos table
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    data_pagamento DATE NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendente', 'cancelado')),
    forma_pagamento VARCHAR(50) DEFAULT 'PIX',
    observacoes TEXT,
    mes_referencia VARCHAR(7)
);

-- RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.pagamentos FOR ALL USING (true);

-- Seed with sample payment
INSERT INTO public.pagamentos (empresa_id, data_pagamento, valor, status, forma_pagamento, mes_referencia)
VALUES ('8ef318ca-1151-4f23-8a5a-aec993a0b6b2', '2026-04-10', 199.00, 'confirmado', 'PIX', '2026-04')
ON CONFLICT DO NOTHING;

-- Verify
SELECT count(*) as total FROM public.pagamentos;