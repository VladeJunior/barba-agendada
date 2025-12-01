import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Revenue Report Export
export const exportRevenueToExcel = (
  chartData: any[],
  metrics: any,
  period: string
) => {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Relatório de Faturamento - InfoBarber"],
    ["Período", period],
    ["Data de Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
    [],
    ["Métricas do Período"],
    ["Faturamento Total", formatCurrency(metrics?.revenue || 0)],
    ["Total de Agendamentos", metrics?.totalAppointments || 0],
    ["Agendamentos Concluídos", metrics?.completedAppointments || 0],
    ["Ticket Médio", formatCurrency(metrics?.averageTicket || 0)],
    ["Crescimento de Faturamento", `${metrics?.revenueGrowth?.toFixed(1) || 0}%`],
    ["Crescimento de Agendamentos", `${metrics?.appointmentGrowth?.toFixed(1) || 0}%`],
    [],
    ["Evolução Diária"],
    ["Data", "Faturamento", "Quantidade"],
  ];

  chartData.forEach((day) => {
    summaryData.push([day.date, day.revenue, day.count]);
  });

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws, "Faturamento");

  XLSX.writeFile(wb, `relatorio-faturamento-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportRevenueToPDF = (
  chartData: any[],
  metrics: any,
  period: string
) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Relatório de Faturamento - InfoBarber", 14, 20);

  // Period info
  doc.setFontSize(11);
  doc.text(`Período: ${period}`, 14, 30);
  doc.text(`Data de Exportação: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 36);

  // Metrics summary
  autoTable(doc, {
    startY: 45,
    head: [["Métrica", "Valor"]],
    body: [
      ["Faturamento Total", formatCurrency(metrics?.revenue || 0)],
      ["Total de Agendamentos", (metrics?.totalAppointments || 0).toString()],
      ["Agendamentos Concluídos", (metrics?.completedAppointments || 0).toString()],
      ["Ticket Médio", formatCurrency(metrics?.averageTicket || 0)],
      ["Crescimento de Faturamento", `${metrics?.revenueGrowth?.toFixed(1) || 0}%`],
      ["Crescimento de Agendamentos", `${metrics?.appointmentGrowth?.toFixed(1) || 0}%`],
    ],
  });

  // Daily evolution
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Data", "Faturamento", "Quantidade"]],
    body: chartData.map((day) => [
      day.date,
      formatCurrency(day.revenue),
      day.count.toString(),
    ]),
  });

  doc.save(`relatorio-faturamento-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

// Barbers Report Export
export const exportBarbersToExcel = (topBarbers: any[], period: string) => {
  const wb = XLSX.utils.book_new();

  const data = [
    ["Relatório de Barbeiros - InfoBarber"],
    ["Período", period],
    ["Data de Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
    [],
    ["Barbeiro", "Atendimentos", "Faturamento"],
  ];

  topBarbers.forEach((barber) => {
    data.push([barber.name, barber.count, barber.revenue]);
  });

  // Add totals
  const totalAppointments = topBarbers.reduce((sum, b) => sum + b.count, 0);
  const totalRevenue = topBarbers.reduce((sum, b) => sum + b.revenue, 0);
  data.push([]);
  data.push(["TOTAL", totalAppointments, totalRevenue]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Barbeiros");

  XLSX.writeFile(wb, `relatorio-barbeiros-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportBarbersToPDF = (topBarbers: any[], period: string) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Relatório de Barbeiros - InfoBarber", 14, 20);

  doc.setFontSize(11);
  doc.text(`Período: ${period}`, 14, 30);
  doc.text(`Data de Exportação: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 36);

  const totalAppointments = topBarbers.reduce((sum, b) => sum + b.count, 0);
  const totalRevenue = topBarbers.reduce((sum, b) => sum + b.revenue, 0);

  autoTable(doc, {
    startY: 45,
    head: [["Barbeiro", "Atendimentos", "Faturamento"]],
    body: [
      ...topBarbers.map((barber) => [
        barber.name,
        barber.count.toString(),
        formatCurrency(barber.revenue),
      ]),
      ["TOTAL", totalAppointments.toString(), formatCurrency(totalRevenue)],
    ],
    foot: [["TOTAL", totalAppointments.toString(), formatCurrency(totalRevenue)]],
  });

  doc.save(`relatorio-barbeiros-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

// Services Report Export
export const exportServicesToExcel = (topServices: any[], period: string) => {
  const wb = XLSX.utils.book_new();

  const data = [
    ["Relatório de Serviços - InfoBarber"],
    ["Período", period],
    ["Data de Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
    [],
    ["Serviço", "Quantidade", "Faturamento"],
  ];

  topServices.forEach((service) => {
    data.push([service.name, service.count, service.revenue]);
  });

  // Add totals
  const totalCount = topServices.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = topServices.reduce((sum, s) => sum + s.revenue, 0);
  data.push([]);
  data.push(["TOTAL", totalCount, totalRevenue]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Serviços");

  XLSX.writeFile(wb, `relatorio-servicos-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportServicesToPDF = (topServices: any[], period: string) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Relatório de Serviços - InfoBarber", 14, 20);

  doc.setFontSize(11);
  doc.text(`Período: ${period}`, 14, 30);
  doc.text(`Data de Exportação: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 36);

  const totalCount = topServices.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = topServices.reduce((sum, s) => sum + s.revenue, 0);

  autoTable(doc, {
    startY: 45,
    head: [["Serviço", "Quantidade", "Faturamento"]],
    body: [
      ...topServices.map((service) => [
        service.name,
        service.count.toString(),
        formatCurrency(service.revenue),
      ]),
      ["TOTAL", totalCount.toString(), formatCurrency(totalRevenue)],
    ],
    foot: [["TOTAL", totalCount.toString(), formatCurrency(totalRevenue)]],
  });

  doc.save(`relatorio-servicos-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
