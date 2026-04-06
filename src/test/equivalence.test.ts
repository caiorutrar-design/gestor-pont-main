import { describe, it, expect } from 'vitest';
import { calcHorasTrabalhadas } from '@/utils/calculadorasPontos';
import { pontoDomainService } from '@/domain/ponto/services/PontoDomainService';
import { RegistroPonto } from '@/domain/ponto/entities/RegistroPonto';
import { TipoRegistro } from '@/domain/ponto/types';
import { Tables } from '@/integrations/supabase/types';

type LegacyRegistroPonto = Tables<'registros_ponto'>;

describe('QA: Paridade de Motores de Cálculo (Old vs New)', () => {
    const colabId = 'colab-qa';
    const orgaoId = 'orgao-qa';

    const createPair = (entrada: string, saida: string) => {
        // Formato Legado (Mocked from useRegistrosPonto)
        const legacy: LegacyRegistroPonto[] = [
            { id: '1', colaborador_id: colabId, tipo: 'entrada', timestamp_registro: entrada } as any,
            { id: '2', colaborador_id: colabId, tipo: 'saida', timestamp_registro: saida } as any
        ];

        // Formato Novo (Entities)
        const novo: RegistroPonto[] = [
            new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date(entrada) }),
            new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.SAIDA, timestamp_registro: new Date(saida) })
        ];

        return { legacy, novo };
    };

    it('deve gerar resultados IDÊNTICOS para uma jornada padrão de 8h', () => {
        const { legacy, novo } = createPair('2026-03-31T08:00:00Z', '2026-03-31T17:00:00Z');
        
        // O motor antigo retorna string "Xh YYm"
        const resultOld = calcHorasTrabalhadas(legacy);
        
        // O motor novo retorna objeto rico
        const resultNew = pontoDomainService.calcularHorasTrabalhadas(novo);

        console.log(`[QA] Legado: ${resultOld} | Novo: ${resultNew.formatado}`);
        
        // Validação de Paridade
        expect(resultNew.formatado).toBe(resultOld);
        expect(resultNew.totalMinutos).toBe(540); // 9h total (incluindo almoço no mock simples)
    });

    it('deve gerar resultados IDÊNTICON para turnos com múltiplas pausas', () => {
        const entrada1 = '2026-03-31T08:00:00Z';
        const saida1   = '2026-03-31T12:00:00Z';
        const entrada2 = '2026-03-31T13:00:00Z';
        const saida2   = '2026-03-31T18:00:00Z';

        const legacy: LegacyRegistroPonto[] = [
            { id: '1', colaborador_id: colabId, tipo: 'entrada', timestamp_registro: entrada1 } as any,
            { id: '2', colaborador_id: colabId, tipo: 'saida', timestamp_registro: saida1 } as any,
            { id: '3', colaborador_id: colabId, tipo: 'entrada', timestamp_registro: entrada2 } as any,
            { id: '4', colaborador_id: colabId, tipo: 'saida', timestamp_registro: saida2 } as any,
        ];

        const novo: RegistroPonto[] = [
            new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date(entrada1) }),
            new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.SAIDA, timestamp_registro: new Date(saida1) }),
            new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date(entrada2) }),
            new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.SAIDA, timestamp_registro: new Date(saida2) }),
        ];

        const resultOld = calcHorasTrabalhadas(legacy);
        const resultNew = pontoDomainService.calcularHorasTrabalhadas(novo);

        console.log(`[QA Múltiplo] Legado: ${resultOld} | Novo: ${resultNew.formatado}`);
        
        expect(resultNew.formatado).toBe(resultOld);
        expect(resultNew.totalMinutos).toBe(240 + 300); // 4h + 5h = 9h (540 min)
    });

    it('deve manter paridade no tratamento de registros desordenados', () => {
        // Entrada às 10h, mas o registro de 08h vem depois no array
        const sets = [
            { tipo: 'entrada', ts: '2026-03-31T10:00:00Z' },
            { tipo: 'entrada', ts: '2026-03-31T08:00:00Z' },
            { tipo: 'saida',   ts: '2026-03-31T12:00:00Z' },
            { tipo: 'saida',   ts: '2026-03-31T09:00:00Z' },
        ];

        const legacy: LegacyRegistroPonto[] = sets.map((s, i) => ({ id: String(i), tipo: s.tipo, timestamp_registro: s.ts } as any));
        const novo: RegistroPonto[] = sets.map(s => new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: s.tipo as any, timestamp_registro: new Date(s.ts) }));

        const resultOld = calcHorasTrabalhadas(legacy);
        const resultNew = pontoDomainService.calcularHorasTrabalhadas(novo);

        // Ambos devem ordenar internamente e calcular 08-09 (1h) + 10-12 (2h) = 3h
        expect(resultNew.formatado).toBe(resultOld);
        expect(resultNew.totalMinutos).toBe(180);
    });
});
