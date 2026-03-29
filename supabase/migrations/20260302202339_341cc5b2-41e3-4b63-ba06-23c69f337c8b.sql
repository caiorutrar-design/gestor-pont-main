
-- Create a secure function to validate senha_ponto using pgcrypto
CREATE OR REPLACE FUNCTION public.validate_senha_ponto(_matricula text, _senha_ponto text)
RETURNS TABLE(id uuid, nome_completo text, matricula text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome_completo, c.matricula
  FROM public.colaboradores c
  WHERE c.matricula = _matricula
    AND c.ativo = true
    AND c.senha_ponto_hash IS NOT NULL
    AND c.senha_ponto_hash = extensions.crypt(_senha_ponto, c.senha_ponto_hash);
END;
$$;

-- Also fix the hash trigger to use extensions schema
CREATE OR REPLACE FUNCTION public.hash_senha_ponto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.senha_ponto IS NOT NULL AND NEW.senha_ponto != '' THEN
    NEW.senha_ponto_hash := extensions.crypt(NEW.senha_ponto, extensions.gen_salt('bf', 10));
    NEW.senha_ponto := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Re-hash existing passwords that weren't hashed (in case first migration failed to hash)
UPDATE public.colaboradores
SET senha_ponto_hash = extensions.crypt(senha_ponto, extensions.gen_salt('bf', 10)),
    senha_ponto = NULL
WHERE senha_ponto IS NOT NULL AND senha_ponto != '' AND senha_ponto_hash IS NULL;
