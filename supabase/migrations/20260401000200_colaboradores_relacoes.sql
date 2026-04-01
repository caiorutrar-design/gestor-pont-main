-- Migration 02: Relação Colaboradores e Unidades de Trabalho
-- Reversível: ALTER TABLE public.colaboradores DROP COLUMN unidade_trabalho_id

-- 1. Verificação se a coluna existe e adição segura
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colaboradores' AND column_name = 'unidade_trabalho_id') THEN
        ALTER TABLE public.colaboradores ADD COLUMN unidade_trabalho_id UUID;
    END IF;
END $$;

-- 2. Garantia da Foreign Key
ALTER TABLE public.colaboradores 
DROP CONSTRAINT IF EXISTS fk_colaboradores_unidade_trabalho,
ADD CONSTRAINT fk_colaboradores_unidade_trabalho 
FOREIGN KEY (unidade_trabalho_id) 
REFERENCES public.unidades_trabalho(id) 
ON DELETE SET NULL;

-- 3. Atribuição de unidade default para quem está sem (Opcional, apenas se existir unidade)
UPDATE public.colaboradores
SET unidade_trabalho_id = (SELECT id FROM public.unidades_trabalho LIMIT 1)
WHERE unidade_trabalho_id IS NULL 
  AND EXISTS (SELECT 1 FROM public.unidades_trabalho);

-- 4. Geolocation Obrigatória
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colaboradores' AND column_name = 'geolocation_obrigatoria') THEN
        ALTER TABLE public.colaboradores ADD COLUMN geolocation_obrigatoria BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
END $$;
