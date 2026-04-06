-- ############################################################
-- # RPC UPDATE: validate_senha_ponto (Extensão de Retorno)
-- ############################################################

DROP FUNCTION IF EXISTS public.validate_senha_ponto(text, text);

CREATE OR REPLACE FUNCTION public.validate_senha_ponto(_matricula text, _senha_ponto text)
RETURNS TABLE(
  id uuid, 
  nome_completo text, 
  matricula text, 
  user_id uuid, 
  orgao_id uuid, 
  lotacao_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, 
    c.nome_completo, 
    c.matricula, 
    c.user_id, 
    c.orgao_id, 
    c.lotacao_id
  FROM public.colaboradores c
  WHERE c.matricula = _matricula
    AND c.ativo = true
    AND c.senha_ponto_hash IS NOT NULL
    AND c.senha_ponto_hash = extensions.crypt(_senha_ponto, c.senha_ponto_hash);
END;
$$;
