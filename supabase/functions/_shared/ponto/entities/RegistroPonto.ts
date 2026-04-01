import { RegistroPontoProps, TipoRegistro } from "../types.ts";

export class RegistroPonto {
  private readonly props: RegistroPontoProps;

  constructor(props: RegistroPontoProps) {
    this.validate(props);
    this.props = Object.freeze(props);
  }

  private validate(props: RegistroPontoProps): void {
    if (!props.colaborador_id) throw new Error("colaborador_id é obrigatório.");
    if (!props.orgao_id) throw new Error("orgao_id é obrigatório.");
    if (!(props.timestamp_registro instanceof Date) || isNaN(props.timestamp_registro.getTime())) {
      throw new Error("timestamp_registro deve ser uma data válida.");
    }
    if (!Object.values(TipoRegistro).includes(props.tipo)) {
      throw new Error(`Tipo de registro inválido: ${props.tipo}`);
    }
  }

  get id(): string | undefined { return this.props.id; }
  get colaborador_id(): string { return this.props.colaborador_id; }
  get orgao_id(): string { return this.props.orgao_id; }
  get timestamp_registro(): Date { return this.props.timestamp_registro; }
  get tipo(): TipoRegistro { return this.props.tipo; }
  get latitude(): number | undefined { return this.props.latitude; }
  get longitude(): number | undefined { return this.props.longitude; }

  ehDoMesmoTipo(outro: RegistroPonto): boolean {
    return this.tipo === outro.tipo;
  }

  diferencaEmMinutos(outro: RegistroPonto): number {
    const diff = Math.abs(this.timestamp_registro.getTime() - outro.timestamp_registro.getTime());
    return Math.floor(diff / 1000 / 60);
  }
}
