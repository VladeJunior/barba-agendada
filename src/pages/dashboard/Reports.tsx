import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboardMetrics, PeriodType } from "@/hooks/useDashboardMetrics";
import { useRevenueChart } from "@/hooks/useRevenueChart";
import { useOperationalMetrics } from "@/hooks/useOperationalMetrics";
import { TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, Users, Download, FileSpreadsheet, FileText, Package } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportRevenueToExcel,
  exportRevenueToPDF,
  exportBarbersToExcel,
  exportBarbersToPDF,
  exportServicesToExcel,
  exportServicesToPDF,
} from "@/lib/exportUtils";
import { ProductSalesReportTab } from "@/components/reports/ProductSalesReportTab";
import { toast } from "sonner";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export default function Reports() {
  const [period, setPeriod] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [activeTab, setActiveTab] = useState("revenue");

  const { data: metrics, isLoading } = useDashboardMetrics(period);
  const { data: chartData, isLoading: chartLoading } = useRevenueChart(period, customRange);
  const { data: operationalData, isLoading: operationalLoading } = useOperationalMetrics(period);

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
        return "Personalizado";
    }
  };

  const handleExportRevenue = (format: "excel" | "pdf") => {
    if (!chartData || !metrics) {
      toast.error("Nenhum dado disponível para exportar");
      return;
    }

    try {
      if (format === "excel") {
        exportRevenueToExcel(chartData, metrics, getPeriodLabel());
        toast.success("Relatório exportado em Excel com sucesso!");
      } else {
        exportRevenueToPDF(chartData, metrics, getPeriodLabel());
        toast.success("Relatório exportado em PDF com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
    }
  };

  const handleExportBarbers = (format: "excel" | "pdf") => {
    if (!metrics?.topBarbers || metrics.topBarbers.length === 0) {
      toast.error("Nenhum dado disponível para exportar");
      return;
    }

    try {
      if (format === "excel") {
        exportBarbersToExcel(metrics.topBarbers, getPeriodLabel());
        toast.success("Relatório exportado em Excel com sucesso!");
      } else {
        exportBarbersToPDF(metrics.topBarbers, getPeriodLabel());
        toast.success("Relatório exportado em PDF com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
    }
  };

  const handleExportServices = (format: "excel" | "pdf") => {
    if (!metrics?.topServices || metrics.topServices.length === 0) {
      toast.error("Nenhum dado disponível para exportar");
      return;
    }

    try {
      if (format === "excel") {
        exportServicesToExcel(metrics.topServices, getPeriodLabel());
        toast.success("Relatório exportado em Excel com sucesso!");
      } else {
        exportServicesToPDF(metrics.topServices, getPeriodLabel());
        toast.success("Relatório exportado em PDF com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
    }
  };

  const renderTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    growth?: number,
    icon?: React.ReactNode
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {growth !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {renderTrendIcon(growth)}
            <span className={cn(
              growth > 0 && "text-green-500",
              growth < 0 && "text-red-500"
            )}>
              {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
            </span>
            <span>vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho da sua barbearia</p>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho da sua barbearia</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={period === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("today")}
          >
            Hoje
          </Button>
          <Button
            variant={period === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("week")}
          >
            Semana
          </Button>
          <Button
            variant={period === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("month")}
          >
            Mês
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Personalizado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: customRange.from, to: customRange.to }}
                onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="barbers">Barbeiros</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="operational">Operacional</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="flex justify-end mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportRevenue("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar para Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportRevenue("pdf")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar para PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderMetricCard(
              "Faturamento Total",
              formatCurrency(metrics?.revenue || 0),
              metrics?.revenueGrowth,
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            )}
            {renderMetricCard(
              "Agendamentos",
              metrics?.totalAppointments || 0,
              metrics?.appointmentGrowth,
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            )}
            {renderMetricCard(
              "Ticket Médio",
              formatCurrency(metrics?.averageTicket || 0),
              undefined,
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            )}
            {renderMetricCard(
              "Concluídos",
              metrics?.completedAppointments || 0,
              undefined,
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução do Faturamento</CardTitle>
              <CardDescription>Faturamento diário no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics?.statusBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics?.statusBreakdown?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductSalesReportTab 
            period={period as any} 
            customRange={customRange}
          />
        </TabsContent>

        <TabsContent value="barbers" className="space-y-6">
          <div className="flex justify-end mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportBarbers("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar para Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportBarbers("pdf")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar para PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Barbeiro</CardTitle>
              <CardDescription>Ranking de barbeiros por faturamento e atendimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.topBarbers || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comissões por Barbeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barbeiro</TableHead>
                    <TableHead className="text-right">Atendimentos</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics?.topBarbers?.map((barber) => (
                    <TableRow key={barber.name}>
                      <TableCell className="font-medium">{barber.name}</TableCell>
                      <TableCell className="text-right">{barber.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(barber.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-end mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportServices("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar para Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportServices("pdf")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar para PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Populares</CardTitle>
              <CardDescription>Ranking dos serviços mais solicitados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.topServices || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics?.topServices?.map((service) => (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-right">{service.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(service.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          {operationalLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <>
              {/* Peak Hours Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Horários de Pico</CardTitle>
                  <CardDescription>
                    Horário mais movimentado: <strong>{operationalData?.peakDay}</strong> às <strong>{operationalData?.peakHour}</strong> ({operationalData?.peakCount} agendamentos)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    {renderMetricCard(
                      "Horário de Pico",
                      `${operationalData?.peakDay} - ${operationalData?.peakHour}`,
                      undefined,
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {renderMetricCard(
                      "Agendamentos no Pico",
                      operationalData?.peakCount || 0,
                      undefined,
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Horário</TableHead>
                          <TableHead className="text-center">Dom</TableHead>
                          <TableHead className="text-center">Seg</TableHead>
                          <TableHead className="text-center">Ter</TableHead>
                          <TableHead className="text-center">Qua</TableHead>
                          <TableHead className="text-center">Qui</TableHead>
                          <TableHead className="text-center">Sex</TableHead>
                          <TableHead className="text-center">Sáb</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operationalData?.heatmapData.map((row) => (
                          <TableRow key={row.hour}>
                            <TableCell className="font-medium">{row.hour}</TableCell>
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => {
                              const value = row[day] || 0;
                              const intensity = Math.min(value / 5, 1);
                              return (
                                <TableCell 
                                  key={day} 
                                  className="text-center"
                                  style={{
                                    backgroundColor: value > 0 
                                      ? `rgba(var(--primary), ${intensity * 0.7})` 
                                      : 'transparent',
                                    color: intensity > 0.5 ? 'white' : 'inherit'
                                  }}
                                >
                                  {value}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation Analysis */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Taxa de Cancelamentos e No-Shows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Taxa de Conclusão</span>
                          <span className="text-sm font-bold text-green-500">
                            {operationalData?.completionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${operationalData?.completionRate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Taxa de Cancelamento</span>
                          <span className="text-sm font-bold text-red-500">
                            {operationalData?.cancellationRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{ width: `${operationalData?.cancellationRate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Taxa de No-Show</span>
                          <span className="text-sm font-bold text-orange-500">
                            {operationalData?.noShowRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${operationalData?.noShowRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={operationalData?.statusDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#f97316" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Client Analysis */}
              <div className="grid gap-4 md:grid-cols-3">
                {renderMetricCard(
                  "Clientes Únicos",
                  operationalData?.totalUniqueClients || 0,
                  undefined,
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
                {renderMetricCard(
                  "Novos Clientes",
                  operationalData?.newClients || 0,
                  undefined,
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
                {renderMetricCard(
                  "Clientes Recorrentes",
                  operationalData?.returningClients || 0,
                  undefined,
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Clientes Mais Frequentes</CardTitle>
                    <CardDescription>Top 10 por número de visitas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead className="text-right">Visitas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operationalData?.topClients.map((client, idx) => (
                          <TableRow key={client.phone}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.phone}</TableCell>
                            <TableCell className="text-right">{client.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Maiores Gastadores</CardTitle>
                    <CardDescription>Top 10 por valor total gasto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead className="text-right">Total Gasto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operationalData?.topSpenders.map((client) => (
                          <TableRow key={client.phone}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.phone}</TableCell>
                            <TableCell className="text-right">{formatCurrency(client.totalSpent)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
