import * as ExcelJS from 'exceljs';
import { format, parseISO, isSaturday, isSunday, getDaysInMonth, endOfMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Registro {
  data_registro: string;
  hora_registro: string;
  tipo: string;
}

interface ColaboradorPontos {
  nome: string;
  matricula: string;
  unidade_trabalho_nome: string;
  cargo: string;
  data_inicio: string;
  data_fim: string;
  registros: Registro[];
}

export const exportarFolhaPontoExcel = async (colaborador: ColaboradorPontos) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Folha de Frequência', {
    pageSetup: { paperSize: 9, orientation: 'portrait', margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } }
  });

  // Estilos padronizados
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
  
  const fontBold: Partial<ExcelJS.Font> = { name: 'Arial', size: 10, bold: true };
  const fontNormal: Partial<ExcelJS.Font> = { name: 'Arial', size: 10 };
  const alignmentCenter: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Definindo larguras das colunas (A a I : 9 colunas no total)
  sheet.columns = [
    { width: 5 },  // A: DIA
    { width: 10 }, // B: E HORA
    { width: 15 }, // C: E RUBRICA
    { width: 10 }, // D: S HORA
    { width: 15 }, // E: S RUBRICA
    { width: 10 }, // F: E HORA (T)
    { width: 15 }, // G: E RUBRICA (T)
    { width: 10 }, // H: S HORA (T)
    { width: 15 }  // I: S RUBRICA (T)
  ];

  // CABEÇALHO
  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').value = 'ESTADO DO MARANHÃO\nINSTITUTO DE PROMOÇÃO E DEFESA DO CIDADÃO E CONSUMIDOR DO ESTADO DO MARANHÃO SIF SAÚDE E PERFORMANCE MA\nFOLHA INDIVIDUAL DE FREQUÊNCIA\nÓRGÃO SIF SAÚDE E PERFORMANCE';
  sheet.getCell('A1').font = { name: 'Arial', size: 10, bold: true };
  sheet.getCell('A1').alignment = alignmentCenter;
  sheet.getRow(1).height = 60;

  // DADOS DO FUNCIONÁRIO - TÍTULOS
  sheet.mergeCells('A2:B2'); sheet.getCell('A2').value = 'MATRÍCULA';
  sheet.mergeCells('C2:G2'); sheet.getCell('C2').value = 'NOME';
  sheet.mergeCells('H2:I2'); sheet.getCell('H2').value = 'MÊS / ANO';
  
  [sheet.getCell('A2'), sheet.getCell('C2'), sheet.getCell('H2')].forEach(c => {
    c.font = fontBold; c.alignment = alignmentCenter;
  });

  // DADOS DO FUNCIONÁRIO - VALORES
  const pInicio = format(parseISO(colaborador.data_inicio), 'dd/MM/yyyy');
  const pFim = format(parseISO(colaborador.data_fim), 'dd/MM/yyyy');
  
  sheet.mergeCells('A3:B3'); sheet.getCell('A3').value = colaborador.matricula;
  sheet.mergeCells('C3:G3'); sheet.getCell('C3').value = colaborador.nome.toUpperCase();
  sheet.mergeCells('H3:I3'); sheet.getCell('H3').value = `${pInicio} a ${pFim}`;
  
  [sheet.getCell('A3'), sheet.getCell('C3'), sheet.getCell('H3')].forEach(c => {
    c.font = fontBold; c.alignment = alignmentCenter;
  });

  // UNIDADE DE TRABALHO E CARGO - TÍTULOS
  sheet.mergeCells('A4:E4'); sheet.getCell('A4').value = 'UNIDADE DE TRABALHO';
  sheet.mergeCells('F4:I4'); sheet.getCell('F4').value = 'CARGO';
  
  sheet.getCell('A4').font = fontBold; sheet.getCell('A4').alignment = alignmentCenter;
  sheet.getCell('F4').font = fontBold; sheet.getCell('F4').alignment = alignmentCenter;

  // UNIDADE DE TRABALHO E CARGO - VALORES
  sheet.mergeCells('A5:E5'); sheet.getCell('A5').value = colaborador.unidade_trabalho_nome?.toUpperCase() || '-';
  sheet.mergeCells('F5:I5'); sheet.getCell('F5').value = colaborador.cargo?.toUpperCase() || '-';
  
  sheet.getCell('A5').font = fontBold; sheet.getCell('A5').alignment = alignmentCenter;
  sheet.getCell('F5').font = fontBold; sheet.getCell('F5').alignment = alignmentCenter;

  // CABEÇALHO HORÁRIOS
  sheet.mergeCells('A6:A7'); sheet.getCell('A6').value = 'DIA';
  sheet.mergeCells('B6:E6'); sheet.getCell('B6').value = 'MANHÃ';
  sheet.mergeCells('F6:I6'); sheet.getCell('F6').value = 'TARDE';
  
  sheet.getCell('B7').value = 'HORA'; sheet.getCell('C7').value = 'RUBRICA';
  sheet.getCell('D7').value = 'HORA'; sheet.getCell('E7').value = 'RUBRICA';
  sheet.getCell('F7').value = 'HORA'; sheet.getCell('G7').value = 'RUBRICA';
  sheet.getCell('H7').value = 'HORA'; sheet.getCell('I7').value = 'RUBRICA';

  // Format header rows
  for (let r = 2; r <= 7; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.border = borderStyle;
      if (r >= 6) {
        cell.font = fontBold;
        cell.alignment = alignmentCenter;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
      }
    }
  }

  // DIAS DO MES
  const mInicio = parseISO(colaborador.data_inicio);
  const mFim = parseISO(colaborador.data_fim);
  const dias = getDaysInMonth(mInicio);
  
  let currentRow = 8;
  
  for (let d = 1; d <= 31; d++) {
    const row = sheet.getRow(currentRow);
    row.getCell(1).value = d;
    row.getCell(1).font = fontNormal;
    row.getCell(1).alignment = alignmentCenter;

    // Check se passou do último dia do mês na query
    if (d > dias) {
      // Deixa em branco, mas aplica bordas
      for(let x = 1; x <=9; x++) row.getCell(x).border = borderStyle;
      currentRow++;
      continue;
    }

    const dataAtual = new Date(mInicio.getFullYear(), mInicio.getMonth(), d);
    const dataStrStr = format(dataAtual, 'yyyy-MM-dd');
    const regsDoDia = colaborador.registros.filter(r => r.data_registro === dataStrStr).sort((a,b) => a.hora_registro.localeCompare(b.hora_registro));

    const isSabado = isSaturday(dataAtual);
    const isDomingo = isSunday(dataAtual);

    if (isSabado || isDomingo) {
      const label = isSabado ? 'SÁBADO' : 'DOMINGO';
      // M: E H/R
      row.getCell(2).value = 'X'; row.getCell(2).font = fontBold; row.getCell(2).alignment = alignmentCenter;
      row.getCell(3).value = label; row.getCell(3).font = fontBold; row.getCell(3).alignment = alignmentCenter;
      // M: S H/R
      row.getCell(4).value = 'X'; row.getCell(4).font = fontBold; row.getCell(4).alignment = alignmentCenter;
      row.getCell(5).value = label; row.getCell(5).font = fontBold; row.getCell(5).alignment = alignmentCenter;
      
      // T: E H/R (na imagem, o sábado só tem MANHÃ preenchido, DOMINGO preenche TARDE tb)
      if (isDomingo) {
        row.getCell(6).value = 'X'; row.getCell(6).font = fontBold; row.getCell(6).alignment = alignmentCenter;
        row.getCell(7).value = label; row.getCell(7).font = fontBold; row.getCell(7).alignment = alignmentCenter;
        row.getCell(8).value = 'X'; row.getCell(8).font = fontBold; row.getCell(8).alignment = alignmentCenter;
        row.getCell(9).value = label; row.getCell(9).font = fontBold; row.getCell(9).alignment = alignmentCenter;
      }
    } else {
       // Dia normal: preencher horas
       // Supondo: [0] = E Manha, [1] = S Manha, [2] = E Tarde, [3] = S Tarde
       if (regsDoDia[0]) { row.getCell(2).value = regsDoDia[0].hora_registro.substring(0,5); row.getCell(2).alignment = alignmentCenter; }
       if (regsDoDia[1]) { row.getCell(4).value = regsDoDia[1].hora_registro.substring(0,5); row.getCell(4).alignment = alignmentCenter; }
       if (regsDoDia[2]) { row.getCell(6).value = regsDoDia[2].hora_registro.substring(0,5); row.getCell(6).alignment = alignmentCenter; }
       if (regsDoDia[3]) { row.getCell(8).value = regsDoDia[3].hora_registro.substring(0,5); row.getCell(8).alignment = alignmentCenter; }
    }

    // Apply borders
    for (let c = 1; c <= 9; c++) {
      row.getCell(c).border = borderStyle;
    }
    
    currentRow++;
  }

  // RODAPÉ
  // OBS
  sheet.mergeCells(`A${currentRow}:I${currentRow}`);
  const obsCell = sheet.getCell(`A${currentRow}`);
  obsCell.value = 'OBS:';
  obsCell.font = fontBold;
  obsCell.alignment = { vertical: 'top', horizontal: 'left' };
  obsCell.border = borderStyle;
  sheet.getRow(currentRow).height = 40;
  currentRow++;

  // ASSINATURAS
  sheet.mergeCells(`A${currentRow}:G${currentRow+1}`); // Left block (Servidor)
  sheet.mergeCells(`H${currentRow}:I${currentRow+1}`); // Right block (Data e Setor)
  
  const colA = sheet.getCell(`A${currentRow}`);
  colA.value = '\n_________________________________________________\nSERVIDOR (A)                         RESPONSÁVEL PELO SETOR';
  colA.alignment = { vertical: 'bottom', horizontal: 'center', wrapText: true };
  colA.border = borderStyle;

  const colH = sheet.getCell(`H${currentRow}`);
  colH.value = '\n____/____/____\nDATA';
  colH.alignment = { vertical: 'bottom', horizontal: 'center' };
  colH.border = borderStyle;

  sheet.getRow(currentRow).height = 40;

  // GERAR BUFFER
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Folha_Frequencia_${colaborador.nome.replace(/\s+/g, '_')}_${format(mInicio, 'MMM_yyyy')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
