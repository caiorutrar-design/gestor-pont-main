-- ==========================================
-- ETAPA 2 (CORRIGIDO): Redesenho do Banco (Triggers e Regras)
-- OBJETO: validar_sequencia_ponto (Versão 2.1)
-- ==========================================

-- 1. Intervalo Configurável
CREATE OR REPLACE FUNCTION public_new.get_config_minutos_intervalo() 
RETURNS INTEGER AS $$ BEGIN RETURN 5; END; $$ LANGUAGE plpgsql;

-- 2. Função de Validação (Robusta contra Turnos Noturnos)
CREATE OR REPLACE FUNCTION public_new.fn_validar_sequencia_ponto()
RETURNS TRIGGER AS $$
DECLARE
    last_record RECORD;
    minutos_intervalo INTEGER;
    diff_segundos INTEGER;
BEGIN
    -- REGRA 0: Ignorar validação para órfãos (migração legada)
    IF NEW.is_orphan = TRUE THEN
        RETURN NEW;
    END IF;

    -- REGRA 1: BUSCAR ÚLTIMO REGISTRO REAL (Sem trava de data_referencia isolada)
    -- Janela de 24h como limite de segurança para performance (fallback)
    SELECT tipo, timestamp_registro INTO last_record
    FROM public_new.registros_ponto
    WHERE colaborador_id = NEW.colaborador_id
      AND timestamp_registro < NEW.timestamp_registro
      AND timestamp_registro > (NEW.timestamp_registro - INTERVAL '24 hours')
    ORDER BY timestamp_registro DESC
    LIMIT 1;

    -- Se houver registro recente
    IF FOUND THEN
        -- REGRA 2: Alternância de Tipo (Entrada -> Saída)
        IF last_record.tipo = NEW.tipo THEN
            -- Proteção contra cliques duplos / Race conditions
            RAISE EXCEPTION 'Batida Consecutiva de %: Já existe um registro do mesmo tipo realizado às %. Aguarde a alternância.', 
                UPPER(NEW.tipo::text), 
                last_record.timestamp_registro::time;
        END IF;

        -- REGRA 3: Intervalo Mínimo (Configurável: 5 min)
        minutos_intervalo := public_new.get_config_minutos_intervalo();
        diff_segundos := EXTRACT(EPOCH FROM (NEW.timestamp_registro - last_record.timestamp_registro));

        IF diff_segundos < (minutos_intervalo * 60) THEN
            RAISE EXCEPTION 'Intervalo Curto: Aguarde % minutos entre as batidas. Batida anterior foi há % segundos.',
                minutos_intervalo,
                ROUND(diff_segundos);
        END IF;
    END IF;

    -- REGRA 4: Proteção Cronológica Global
    -- Garante que não se insira ponto em janela anterior a qualquer ponto existente
    IF EXISTS (
        SELECT 1 FROM public_new.registros_ponto 
        WHERE colaborador_id = NEW.colaborador_id 
          AND timestamp_registro >= NEW.timestamp_registro
          AND is_orphan = FALSE -- Ignora órfãos para permitir re-migração
    ) THEN
        RAISE EXCEPTION 'Conflito Cronológico: Tentativa de inserir registro em horário coincidente ou anterior a batidas existentes.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Aplicação do Trigger (BEFORE INSERT para proteção máxima)
DROP TRIGGER IF EXISTS trg_validar_sequencia ON public_new.registros_ponto;
CREATE TRIGGER trg_validar_sequencia
    BEFORE INSERT ON public_new.registros_ponto
    FOR EACH ROW
    EXECUTE FUNCTION public_new.fn_validar_sequencia_ponto();

-- Nota sobre Concorrência: A constraint UNIQUE id_timestamp_tipo é o nível final de isolamento 
-- que preventivamente bloqueia inserções simultâneas idênticas se o trigger passar.
