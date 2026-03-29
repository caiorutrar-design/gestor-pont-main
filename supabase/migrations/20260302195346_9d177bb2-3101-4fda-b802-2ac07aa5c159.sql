
-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add hashed password column
ALTER TABLE public.colaboradores ADD COLUMN senha_ponto_hash text;

-- Migrate existing plaintext passwords to bcrypt hashes
UPDATE public.colaboradores
SET senha_ponto_hash = crypt(senha_ponto, gen_salt('bf', 10))
WHERE senha_ponto IS NOT NULL AND senha_ponto != '';

-- Set plaintext column to NULL (keep column for backwards compat with types)
UPDATE public.colaboradores SET senha_ponto = NULL;

-- Create trigger to auto-hash senha_ponto on insert/update
CREATE OR REPLACE FUNCTION public.hash_senha_ponto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.senha_ponto IS NOT NULL AND NEW.senha_ponto != '' THEN
    NEW.senha_ponto_hash := crypt(NEW.senha_ponto, gen_salt('bf', 10));
    NEW.senha_ponto := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hash_senha_ponto_trigger
BEFORE INSERT OR UPDATE ON public.colaboradores
FOR EACH ROW
EXECUTE FUNCTION public.hash_senha_ponto();
