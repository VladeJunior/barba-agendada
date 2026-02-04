import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, FileSpreadsheet, FileText, Package, Users, DollarSign, CreditCard } from "lucide-react";
import { useProductSalesReport, ReportPeriod } from "@/hooks/useProductSalesReport";
import { useBarbers } from "@/hooks/useBarbers";
import { exportProductSalesToExcel, exportProductSalesToPDF } from "@/lib/exportProductSalesUtils";
import { toast } from "sonner";

interface ProductSalesReportTabProps {
  period: ReportPeriod;
  customRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

const PAYMENT_COLORS = ["hsl(var(--primary))", "#22c55e", "#3b82f6", "#f97316", "#8b5cf6"];

export function ProductSalesReportTab({ period, customRange }: ProductSalesReportTabProps) {
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>();

  const { data: barbers } = useBarbers();
  const { data: reportData, isLoading } = useProductSalesReport({
    period,
    barberId: selectedBarberId,
    paymentMethod: selectedPaymentMethod,
    customRange,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Hoje";
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mês";
      default:
        if (customRange?.from && customRange?.to) {
          return `${format(customRange.from, "dd/MM/yyyy")} - ${format(customRange.to, "dd/MM/yyyy")}`;
        }
        return "Personalizado";
    }
  };

  const handleExport = (type: "excel" | "pdf") => {
    if (!reportData) {
      toast.error("Nenhum dado disponível para exportar");
      return;
    }

    try {
      if (type === "excel") {
        exportProductSalesToExcel(reportData, getPeriodLabel());
        toast.success("Relatório exportado em Excel com sucesso!");
      } else {
        exportProductSalesToPDF(reportData, getPeriodLabel());
        toast.success("Relatório exportado em PDF com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Exportação */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Select value={selectedBarberId || "all"} onValueChange={(v) => setSelectedBarberId(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os barbeiros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers?.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPaymentMethod || "all"} onValueChange={(v) => setSelectedPaymentMethod(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as formas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as formas</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="credito">Cartão Crédito</SelectItem>
              <SelectItem value="debito">Cartão Débito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar para Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar para PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.metrics.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.metrics.totalQuantity || 0}</div>
            <p className="text-xs text-muted-foreground">itens vendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData?.metrics.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData?.metrics.totalCommission || 0)}</div>
            <p className="text-xs text-muted-foreground">geradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData?.metrics.averageTicket || 0)}</div>
            <p className="text-xs text-muted-foreground">por venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      {reportData?.chartData && reportData.chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas</CardTitle>
            <CardDescription>Faturamento diário de produtos no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                  name="Faturamento"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Ranking por faturamento</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData?.topProducts && reportData.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.topProducts.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product_name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="total_revenue" fill="hsl(var(--primary))" name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhuma venda no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por Forma de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Forma de Pagamento</CardTitle>
            <CardDescription>Distribuição de métodos</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData?.salesByPaymentMethod && reportData.salesByPaymentMethod.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={reportData.salesByPaymentMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.method}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="method"
                  >
                    {reportData.salesByPaymentMethod.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhuma venda no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas por Barbeiro */}
      {reportData?.salesByBarber && reportData.salesByBarber.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Barbeiro</CardTitle>
            <CardDescription>Performance de vendas de produtos por colaborador</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.salesByBarber.map((barber) => (
                  <TableRow key={barber.barber_id}>
                    <TableCell className="font-medium">{barber.barber_name}</TableCell>
                    <TableCell className="text-right">{barber.total_quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(barber.total_revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(barber.total_commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tabela Detalhada de Vendas */}
      {reportData?.sales && reportData.sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas Detalhadas</CardTitle>
            <CardDescription>Lista completa de transações no período</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Cliente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.sales.slice(0, 20).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm">
                      {format(new Date(sale.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{sale.product_name}</TableCell>
                    <TableCell className="text-center">{sale.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.total_price)}</TableCell>
                    <TableCell>{sale.barber_name || "-"}</TableCell>
                    <TableCell>{sale.payment_method || "-"}</TableCell>
                    <TableCell>{sale.client_name || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {reportData.sales.length > 20 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Mostrando 20 de {reportData.sales.length} vendas. Exporte para ver todas.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!reportData?.sales || reportData.sales.length === 0) && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma venda de produto no período
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou selecionar outro período.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
