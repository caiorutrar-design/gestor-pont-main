import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportData {
  columns: string[];
  rows: any[][];
  fileName: string;
  title: string;
}

export const exportToPDF = ({ columns, rows, fileName, title }: ExportData) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const now = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

  // Cabeçalho Premium
  doc.setFontSize(20);
  doc.setTextColor(197, 27, 41); // Vermelho PROCON
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${now}`, 14, 30);
  doc.text('Gestor de Ponto - PROCON MA', 14, 35);

  // Linha divisória
  doc.setDrawColor(197, 27, 41);
  doc.line(14, 40, 280, 40);

  autoTable(doc, {
    startY: 45,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: { 
      fillColor: [197, 27, 41],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 45 },
  });

  doc.save(`${fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportToExcel = async ({ columns, rows, fileName, title }: ExportData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório');

  // Adicionar Título
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true, color: { argb: 'C51B29' } };
  titleCell.alignment = { horizontal: 'center' };

  // Adicionar Cabeçalhos
  const headerRow = worksheet.addRow(columns);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'C51B29' }
    };
    cell.font = { color: { argb: 'FFFFFF' }, bold: true };
  });

  // Adicionar Dados
  worksheet.addRows(rows);

  // Ajustar largura das colunas
  worksheet.columns.forEach(column => {
    column.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
