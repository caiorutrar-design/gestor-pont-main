import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, differenceInMinutes } from "date-fns";

export interface ColaboradorResumo {
  id: string;
  nome: string;
  matricula: string;
  unidade_trabalho_nome: string;
  cargo: string;
  registros: { data_registro: string; hora_registro: string; tipo: string }[];
}

export const exportToPDF = (
  dados: ColaboradorResumo[],
  periodo: string,
  gestor?: string,
  orgaoNome?: string
) => {
  // 1. Inicializa o PDF em modo Paisagem (Landscape) A4
  const doc = new jsPDF("landscape", "pt", "a4");

  // 2. Definir cores e fontes do Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const title = "RELATÓRIO DE PONTO / CONTROLE DE JORNADA";
  const empresa = orgaoNome ? `ÓRGÃO: ${orgaoNome.toUpperCase()}` : "ESTADO DO MARANHÃO - SIF SAÚDE E PERFORMANCE MA";
  
  doc.text(empresa, 40, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(title, 40, 56);
  doc.text(`Período: ${periodo}`, 40, 72);
  if (gestor) {
    doc.text(`Gestor(a): ${gestor}`, 40, 88);
  }

  // 3. Preparar e Achatar (Flatten) os Dados
  const tableRows: any[][] = [];
  let totalMinutosGeral = 0;

  // Ordena colaboradores por nome
  const colabsOrdenados = [...dados].sort((a, b) => a.nome.localeCompare(b.nome));

  for (const colab of colabsOrdenados) {
    // Agrupa os registros deste colaborador por data
    const regsPorData = colab.registros.reduce((acc, r) => {
      if (!acc[r.data_registro]) acc[r.data_registro] = [];
      acc[r.data_registro].push(r);
      return acc;
    }, {} as Record<string, typeof colab.registros>);

    const datasDoColab = Object.keys(regsPorData).sort();
    let minTColab = 0;

    if (datasDoColab.length === 0) {
      // Caso o colaborador não tenha registros mapeados neste mês
      tableRows.push([
        "-",
        colab.nome.toUpperCase(),
        "-", "-", "-", "-",
        "0h 00m"
      ]);
      continue;
    }

    for (const dataStr of datasDoColab) {
      const regsDia = regsPorData[dataStr].sort((a, b) => a.hora_registro.localeCompare(b.hora_registro));
      
      const e1 = regsDia[0]?.hora_registro.substring(0, 5) || "-";
      const s1 = regsDia[1]?.hora_registro.substring(0, 5) || "-";
      const e2 = regsDia[2]?.hora_registro.substring(0, 5) || "-";
      const s2 = regsDia[3]?.hora_registro.substring(0, 5) || "-";

      let minTDia = 0;
      if (regsDia[0] && regsDia[1]) {
        minTDia += differenceInMinutes(
          parseISO(`${dataStr}T${regsDia[1].hora_registro}`),
          parseISO(`${dataStr}T${regsDia[0].hora_registro}`)
        );
      }
      if (regsDia[2] && regsDia[3]) {
        minTDia += differenceInMinutes(
          parseISO(`${dataStr}T${regsDia[3].hora_registro}`),
          parseISO(`${dataStr}T${regsDia[2].hora_registro}`)
        );
      }

      minTColab += minTDia;
      
      const horasStr = `${Math.floor(minTDia / 60)}h ${String(minTDia % 60).padStart(2, "0")}m`;

      tableRows.push([
        format(parseISO(dataStr), "dd/MM/yyyy"),
        colab.nome.toUpperCase(),
        e1,
        s1,
        e2,
        s2,
        horasStr
      ]);
    }
    
    // Subtotal do Colaborador
    totalMinutosGeral += minTColab;
    const subHorasStr = `${Math.floor(minTColab / 60)}h ${String(minTColab % 60).padStart(2, "0")}m`;
    
    tableRows.push([
      { content: "SUBTOTAL", styles: { fontStyle: 'bold', halign: 'right' } },
      { content: colab.nome.toUpperCase(), styles: { fontStyle: 'bold' } },
      "-", "-", "-", "-",
      { content: subHorasStr, styles: { fontStyle: 'bold' } }
    ]);
  }

  // 4. Inserir a Tabela com jspdf-autotable
  const tableColumns = ["Data", "Colaborador", "Entrada 1", "Saída 1", "Entrada 2", "Saída 2", "Horas Trab."];

  autoTable(doc, {
    startY: gestor ? 100 : 85,
    head: [tableColumns],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 70 }, // Data
      1: { halign: "left", cellWidth: "auto" }, // Colaborador
      2: { halign: "center", cellWidth: 70 }, // E1
      3: { halign: "center", cellWidth: 70 }, // S1
      4: { halign: "center", cellWidth: 70 }, // E2
      5: { halign: "center", cellWidth: 70 }, // S2
      6: { halign: "center", cellWidth: 80 }, // Total
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    // Criação de numeração de páginas no rodapé
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 20
      );
    },
  });

  // 5. Totalizador no Fim do Relatório
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const totalHorasGeralStr = `${Math.floor(totalMinutosGeral / 60)}h ${String(totalMinutosGeral % 60).padStart(2, "0")}m`;
  doc.text(`TOTAL GERAL DO PERÍODO: ${totalHorasGeralStr}`, 40, finalY);

  // 6. Salvamento do Arquivo
  const fileName = `Relatorio_Ponto_Consolidado_${format(new Date(), "dd-MM-yyyy")}.pdf`;
  doc.save(fileName);
};
