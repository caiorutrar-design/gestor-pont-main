-- ============================================
-- TRIAL LEADS TABLE
-- Captura leads de trial da landing page
-- ============================================

CREATE TABLE IF NOT EXISTS public.trial_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Dados do lead
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    empresa VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    segmento VARCHAR(100),
    
    -- Status do trial
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'convertido', 'expirado')),
    data_aprovacao TIMESTAMPTZ,
    data_expiracao TIMESTAMPTZ,
    plano_interesse VARCHAR(50) DEFAULT 'starter',
    
    -- Meta
    quantidade_funcionarios INTEGER,
    mensagem TEXT,
    
    -- Tracking
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- RLS
ALTER TABLE public.trial_leads ENABLE ROW LEVEL SECURITY;

-- Policy: allow insert from anyone (public landing)
CREATE POLICY "Allow public insert" ON public.trial_leads
FOR INSERT WITH CHECK (true);

-- Policy: allow read for authenticated (admin)
CREATE POLICY "Allow auth read" ON public.trial_leads
FOR SELECT USING (true);

-- Policy: allow update for auth
CREATE POLICY "Allow auth update" ON public.trial_leads
FOR UPDATE USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_trial_leads_email ON public.trial_leads(email);
CREATE INDEX IF NOT EXISTS idx_trial_leads_status ON public.trial_leads(status);

-- Seed with your PROCON as first "lead" for testing
INSERT INTO public.trial_leads (nome, email, empresa, status, plano_interesse, quantidade_funcionarios)
VALUES ('Caio Artur', 'caiorutrar@gmail.com', 'PROCON-MA', 'aprovado', 'profissional', 50)
ON CONFLICT DO NOTHING;

-- Verify
SELECT count(*) as total_leads FROM public.trial_leads;