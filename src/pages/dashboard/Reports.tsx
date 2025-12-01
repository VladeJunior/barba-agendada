import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboardMetrics, PeriodType } from "@/hooks/useDashboardMetrics";
import { useRevenueChart } from "@/hooks/useRevenueChart";
import { TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, Users, Scissors } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
        <TabsList>
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="barbers">Barbeiros</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
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

        <TabsContent value="barbers" className="space-y-6">
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
      </Tabs>
    </div>
  );
}
