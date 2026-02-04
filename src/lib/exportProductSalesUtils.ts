import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface ProductSalesReportData {
  metrics: {
    totalSales: number;
    totalQuantity: number;
    totalRevenue: number;
    totalCommission: number;
    averageTicket: number;
  };
  topProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  salesByBarber: Array<{
    barber_name: string;
    total_quantity: number;
    total_revenue: number;
    total_commission: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  sales: Array<{
    product_name: string;
    barber_name: string | null;
    quantity: number;
    total_price: number;
    payment_method: string | null;
    client_name: string | null;
    created_at: string;
  }>;
}

export const exportProductSalesToExcel = (
  data: ProductSalesReportData,
  period: string
) => {
  const wb = XLSX.utils.book_new();

  // Resumo sheet
  const summaryData = [
    ["Relatório de Vendas de Produtos - InfoBarber"],
    ["Período", period],
    ["Data de Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
    [],
    ["Métricas do Período"],
    ["Total de Vendas", data.metrics.totalSales],
    ["Quantidade Vendida", data.metrics.totalQuantity],
    ["Faturamento Total", data.metrics.totalRevenue],
    ["Comissões Geradas", data.metrics.totalCommission],
    ["Ticket Médio", data.metrics.averageTicket],
    [],
    ["Top Produtos"],
    ["Produto", "Quantidade", "Faturamento"],
  ];

  data.topProducts.forEach((product) => {
    summaryData.push([product.product_name, product.total_quantity, product.total_revenue] as any);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Resumo");

  // Vendas por Barbeiro sheet
  const barberData = [
    ["Vendas por Barbeiro"],
    ["Barbeiro", "Quantidade", "Faturamento", "Comissão"],
  ];
  data.salesByBarber.forEach((barber) => {
    barberData.push([
      barber.barber_name,
      barber.total_quantity,
      barber.total_revenue,
      barber.total_commission,
    ] as any);
  });
  const barberSheet = XLSX.utils.aoa_to_sheet(barberData);
  XLSX.utils.book_append_sheet(wb, barberSheet, "Por Barbeiro");

  // Vendas por Pagamento sheet
  const paymentData = [
    ["Vendas por Forma de Pagamento"],
    ["Método", "Quantidade", "Total"],
  ];
  data.salesByPaymentMethod.forEach((payment) => {
    paymentData.push([payment.method, payment.count, payment.total] as any);
  });
  const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
  XLSX.utils.book_append_sheet(wb, paymentSheet, "Por Pagamento");

  // Vendas Detalhadas sheet
  const salesData = [
    ["Vendas Detalhadas"],
    ["Data", "Produto", "Quantidade", "Valor", "Barbeiro", "Pagamento", "Cliente"],
  ];
  data.sales.forEach((sale) => {
    salesData.push([
      format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      sale.product_name,
      sale.quantity,
      sale.total_price,
      sale.barber_name || "-",
      sale.payment_method || "-",
      sale.client_name || "-",
    ] as any);
  });
  const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, salesSheet, "Detalhado");

  XLSX.writeFile(wb, `relatorio-vendas-produtos-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportProductSalesToPDF = (
  data: ProductSalesReportData,
  period: string
) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text("Relatório de Vendas de Produtos", 14, 20);
  doc.setFontSize(10);
  doc.text("InfoBarber", 14, 26);

  // Período
  doc.setFontSize(11);
  doc.text(`Período: ${period}`, 14, 36);
  doc.text(`Exportado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 42);

  // Métricas
  autoTable(doc, {
    startY: 50,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Vendas", data.metrics.totalSales.toString()],
      ["Quantidade Vendida", data.metrics.totalQuantity.toString()],
      ["Faturamento Total", formatCurrency(data.metrics.totalRevenue)],
      ["Comissões Geradas", formatCurrency(data.metrics.totalCommission)],
      ["Ticket Médio", formatCurrency(data.metrics.averageTicket)],
    ],
    theme: "striped",
    headStyles: { fillColor: [212, 175, 55] },
  });

  // Top Produtos
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text("Top Produtos", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Produto", "Qtd", "Faturamento"]],
    body: data.topProducts.slice(0, 10).map((p) => [
      p.product_name,
      p.total_quantity.toString(),
      formatCurrency(p.total_revenue),
    ]),
    theme: "striped",
    headStyles: { fillColor: [212, 175, 55] },
  });

  // Vendas por Barbeiro
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(12);
  doc.text("Vendas por Barbeiro", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Barbeiro", "Qtd", "Faturamento", "Comissão"]],
    body: data.salesByBarber.map((b) => [
      b.barber_name,
      b.total_quantity.toString(),
      formatCurrency(b.total_revenue),
      formatCurrency(b.total_commission),
    ]),
    theme: "striped",
    headStyles: { fillColor: [212, 175, 55] },
  });

  // Vendas por Forma de Pagamento
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(12);
  doc.text("Vendas por Forma de Pagamento", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Método", "Vendas", "Total"]],
    body: data.salesByPaymentMethod.map((p) => [
      p.method,
      p.count.toString(),
      formatCurrency(p.total),
    ]),
    theme: "striped",
    headStyles: { fillColor: [212, 175, 55] },
  });

  doc.save(`relatorio-vendas-produtos-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
