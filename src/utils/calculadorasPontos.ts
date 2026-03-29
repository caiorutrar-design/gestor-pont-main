import { differenceInMinutes, parseISO } from "date-fns";
import { RegistroPonto } from "@/hooks/useRegistrosPonto";

export interface ColaboradorAgrupado {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  unidade_trabalho_nome: string;
  registros: RegistroPonto[];
}

export const agruparRegistrosPorColaborador = (
  registros: RegistroPonto[],
  busca: string
): ColaboradorAgrupado[] => {
  const mapa = registros.reduce((acc, r) => {
    const colab = r.colaborador;
    if (!colab) return acc;

    const userId = colab.id;
    if (!acc[userId]) {
      acc[userId] = {
        id: userId,
        nome: colab.nome_completo,
        matricula: colab.matricula,
        cargo: colab.cargo,
        unidade_trabalho_nome: (colab as any).unidade_trabalho?.nome || colab.lotacao?.nome || "Não informada",
        registros: [],
      };
    }
    acc[userId].registros.push(r);
    return acc;
  }, {} as Record<string, ColaboradorAgrupado>);

  let resultado = Object.values(mapa).sort((a, b) => a.nome.localeCompare(b.nome));

  if (busca) {
    const termo = busca.toLowerCase();
    resultado = resultado.filter(r =>
      r.nome.toLowerCase().includes(termo) || r.matricula.includes(termo)
    );
  }
  return resultado;
};

export const calcHorasTrabalhadas = (regs: RegistroPonto[]): string => {
  if (!regs || regs.length === 0) return "0h 00m";
  
  // Ordena registros cronologicamente
  const ordernados = [...regs].sort((a, b) => a.timestamp_registro.localeCompare(b.timestamp_registro));
  let minT = 0;
  
  for (let i = 0; i < ordernados.length - 1; i++) {
    if (ordernados[i].tipo === "entrada" && ordernados[i + 1]?.tipo === "saida") {
      minT += differenceInMinutes(
        parseISO(ordernados[i + 1].timestamp_registro),
        parseISO(ordernados[i].timestamp_registro)
      );
      i++; // Pula o de saída já contabilizado
    }
  }
  return `${Math.floor(minT / 60)}h ${String(minT % 60).padStart(2, "0")}m`;
};
