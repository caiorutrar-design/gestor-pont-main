import { describe, it, expect, beforeEach } from 'vitest';
import { PontoDomainService } from '../PontoDomainService';
import { RegistroPonto } from '../../entities/RegistroPonto';
import { TipoRegistro } from '../../types';

describe('PontoDomainService', () => {
  let service: PontoDomainService;
  const colabId = 'colab-123';
  const orgaoId = 'orgao-456';

  beforeEach(() => {
    service = new PontoDomainService();
  });

  describe('Cenários de Validação (Registro)', () => {
    it('deve permitir registro se for a primeira batida', () => {
      const nova = new RegistroPonto({
        colaborador_id: colabId,
        orgao_id: orgaoId,
        timestamp_registro: new Date('2026-03-31T08:00:00Z'),
        tipo: TipoRegistro.ENTRADA
      });
      
      expect(() => service.validarNovaBatida(nova)).not.toThrow();
    });

    it('deve lançar erro ao registrar duas entradas seguidas', () => {
      const ultimo = new RegistroPonto({
        colaborador_id: colabId,
        orgao_id: orgaoId,
        timestamp_registro: new Date('2026-03-31T08:00:00Z'),
        tipo: TipoRegistro.ENTRADA
      });
      
      const nova = new RegistroPonto({
        colaborador_id: colabId,
        orgao_id: orgaoId,
        timestamp_registro: new Date('2026-03-31T09:00:00Z'),
        tipo: TipoRegistro.ENTRADA
      });

      expect(() => service.validarNovaBatida(nova, ultimo)).toThrow(/Ação Inválida/);
    });

    it('deve lançar erro se o intervalo for menor que 5 minutos', () => {
      const ultimo = new RegistroPonto({
        colaborador_id: colabId,
        orgao_id: orgaoId,
        timestamp_registro: new Date('2026-03-31T08:00:00Z'),
        tipo: TipoRegistro.ENTRADA
      });
      
      const nova = new RegistroPonto({
        colaborador_id: colabId,
        orgao_id: orgaoId,
        timestamp_registro: new Date('2026-03-31T08:04:00Z'),
        tipo: TipoRegistro.SAIDA
      });

      expect(() => service.validarNovaBatida(nova, ultimo)).toThrow(/Intervalo Curto/);
    });

    it('deve lançar erro se a nova batida for anterior à última (cronologia)', () => {
      const ultimo = new RegistroPonto({
        colaborador_id: colabId,
        orgao_id: orgaoId,
        timestamp_registro: new Date('2026-03-31T10:00:00Z'),
        tipo: TipoRegistro.ENTRADA
      });
      
      const nova = new RegistroPonto({
        colaborador_id: colabId,
        orgao_id: orgaoId,
        timestamp_registro: new Date('2026-03-31T09:30:00Z'),
        tipo: TipoRegistro.SAIDA
      });

      expect(() => service.validarNovaBatida(nova, ultimo)).toThrow(/Erro Cronológico/);
    });
  });

  describe('Cenários de Cálculo (Horas Trabalhadas)', () => {
    it('deve calcular corretamente um fluxo normal de 4 horas', () => {
      const registros = [
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date('2026-03-31T08:00:00Z') }),
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.SAIDA, timestamp_registro: new Date('2026-03-31T12:00:00Z') })
      ];

      const resultado = service.calcularHorasTrabalhadas(registros);
      expect(resultado.totalMinutos).toBe(240);
      expect(resultado.formatado).toBe('4h 00m');
    });

    it('deve calcular corretamente um turno noturno (cruzando meia-noite)', () => {
      const registros = [
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date('2026-03-31T23:50:00Z') }),
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.SAIDA, timestamp_registro: new Date('2026-04-01T00:10:00Z') })
      ];

      const resultado = service.calcularHorasTrabalhadas(registros);
      expect(resultado.totalMinutos).toBe(20);
      expect(resultado.formatado).toBe('0h 20m');
    });

    it('deve ignorar entradas sem saída correspondente e reportar inconsistência', () => {
      const registros = [
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date('2026-03-31T08:00:00Z') }),
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date('2026-03-31T13:00:00Z') }),
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.SAIDA, timestamp_registro: new Date('2026-03-31T17:00:00Z') })
      ];

      const resultado = service.calcularHorasTrabalhadas(registros);
      // Pareia o segundo Entrada (13h) com o Saída (17h) = 4h (240 min)
      // O primeiro Entrada (08h) fica órfão.
      expect(resultado.totalMinutos).toBe(240);
      expect(resultado.inconsistencias.length).toBe(1);
      expect(resultado.inconsistencias[0]).toContain('sem saída correspondente');
    });

    it('deve ignorar saídas sem entrada correspondente e reportar inconsistência', () => {
      const registros = [
        new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.SAIDA, timestamp_registro: new Date('2026-03-31T08:00:00Z') })
      ];

      const resultado = service.calcularHorasTrabalhadas(registros);
      expect(resultado.totalMinutos).toBe(0);
      expect(resultado.inconsistencias.length).toBe(1);
      expect(resultado.inconsistencias[0]).toContain('sem entrada correspondente');
    });
  });

  describe('Determinação de Próxima Batida', () => {
    it('deve sugerir ENTRADA se não houver registros', () => {
      expect(service.determinarProximaBatida()).toBe(TipoRegistro.ENTRADA);
    });

    it('deve sugerir SAIDA se o último registro for ENTRADA', () => {
      const ultimo = new RegistroPonto({ colaborador_id: colabId, orgao_id: orgaoId, tipo: TipoRegistro.ENTRADA, timestamp_registro: new Date() });
      expect(service.determinarProximaBatida(ultimo)).toBe(TipoRegistro.SAIDA);
    });
  });
});
