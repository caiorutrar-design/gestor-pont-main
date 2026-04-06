-- Migration 03: Cast Jornada TEXT -> TIME
-- Reversível: ALTER TABLE public.colaboradores ALTER COLUMN jornada_... TYPE TEXT

-- 1. Helper function for safe cast (prevents migration failure on bad data)
CREATE OR REPLACE FUNCTION public.safe_cast_to_time(_val TEXT, _default TIME DEFAULT '08:00:00'::TIME) 
RETURNS TIME 
LANGUAGE plpgsql 
AS $$
BEGIN
    -- Regex to clean common noise (e.g. "8h" -> "08:00:00")
    _val = regexp_replace(_val, '[^0-9:]', '', 'g');
    
    -- If string is numeric only and has 1-2 chars (e.g. "8")
    IF _val ~ '^[0-9]{1,2}$' THEN
        RETURN (_val || ':00:00')::TIME;
    END IF;

    -- Standard cast
    RETURN _val::TIME;
EXCEPTION WHEN OTHERS THEN
    RETURN _role_default; -- Fallback em caso de erro bizarro
END;
$$;

-- 2. Alteração de Colunas
ALTER TABLE public.colaboradores 
    ALTER COLUMN jornada_entrada_manha TYPE TIME USING public.safe_cast_to_time(jornada_entrada_manha, '08:00:00'),
    ALTER COLUMN jornada_saida_manha TYPE TIME USING public.safe_cast_to_time(jornada_saida_manha, '12:00:00'),
    ALTER COLUMN jornada_entrada_tarde TYPE TIME USING public.safe_cast_to_time(jornada_entrada_tarde, '14:00:00'),
    ALTER COLUMN jornada_saida_tarde TYPE TIME USING public.safe_cast_to_time(jornada_saida_tarde, '18:00:00');

-- 3. Defaults para novas inserções
ALTER TABLE public.colaboradores 
    ALTER COLUMN jornada_entrada_manha SET DEFAULT '08:00:00'::TIME,
    ALTER COLUMN jornada_saida_manha SET DEFAULT '12:00:00'::TIME,
    ALTER COLUMN jornada_entrada_tarde SET DEFAULT '14:00:00'::TIME,
    ALTER COLUMN jornada_saida_tarde SET DEFAULT '18:00:00'::TIME;

-- 4. Cleanup
DROP FUNCTION IF EXISTS public.safe_cast_to_time;
