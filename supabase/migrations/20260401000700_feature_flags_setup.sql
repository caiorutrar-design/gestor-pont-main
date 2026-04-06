-- Migration 07: Inicialização de Feature Flags da Etapa 1
-- Reversível: DELETE FROM public.feature_flags WHERE key = 'new_geo_validation'

INSERT INTO public.feature_flags (key, enabled, description)
VALUES (
    'new_geo_validation', 
    false, 
    'Habilita a nova lógica de validação geográfica robusta na Edge Function v2.'
)
ON CONFLICT (key) DO UPDATE 
SET description = EXCLUDED.description;
