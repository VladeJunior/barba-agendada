import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
  CalendarIcon,
  DollarSign,
  Receipt,
  Users,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useBarbers } from "@/hooks/useBarbers";
import {
  useCommissionSummary,
  useCommissionPayments,
  CommissionFilters,
} from "@/hooks/useCommissionControl";
import { PayCommissionDialog } from "@/components/dashboard/PayCommissionDialog";
import { BarberCommissionSummary } from "@/hooks/useCommissionControl";

const statusConfig = {
  pending: { label: "Pendente", variant: "destructive" as const, icon: Clock },
  partial: { label: "Parcial", variant: "secondary" as const, icon: Receipt },
  paid: { label: "Pago", variant: "default" as const, icon: CheckCircle },
};

export default function CommissionControl() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedBarber, setSelectedBarber] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedBarberForPayment, setSelectedBarberForPayment] =
    useState<BarberCommissionSummary | null>(null);

  const { data: barbers } = useBarbers();

  const filters: CommissionFilters = {
    startDate: dateRange?.from || startOfMonth(new Date()),
    endDate: dateRange?.to || endOfMonth(new Date()),
    barberId: selectedBarber !== "all" ? selectedBarber : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  };

  const { data: commissionData, isLoading } = useCommissionSummary(filters);
  const { data: payments } = useCommissionPayments(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handlePayClick = (barber: BarberCommissionSummary) => {
    setSelectedBarberForPayment(barber);
    setPayDialogOpen(true);
  };

  const setQuickPeriod = (months: number) => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, months));
    const end = months === 0 ? endOfMonth(now) : endOfMonth(subMonths(now, months));
    setDateRange({ from: start, to: end });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-gold" />
          Controle de Comissões
        </h1>
        <p className="text-muted-foreground">
          Gerencie os pagamentos de comissões dos seus barbeiros
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Date Range */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      "Selecione o período"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex gap-2 p-2 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickPeriod(0)}
                    >
                      Este mês
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickPeriod(1)}
                    >
                      Mês passado
                    </Button>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Barber Filter */}
            <div className="w-[180px]">
              <label className="text-sm font-medium mb-2 block">Barbeiro</label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {barbers?.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[150px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(commissionData?.totals.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">no período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">
              {formatCurrency(commissionData?.totals.totalCommission || 0)}
            </div>
            <p className="text-xs text-muted-foreground">a pagar aos barbeiros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(commissionData?.totals.totalPaid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">pagamentos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(commissionData?.totals.totalPending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">aguardando pagamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Commissions by Barber */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Comissões por Barbeiro
          </CardTitle>
          <CardDescription>
            Resumo das comissões no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : commissionData?.summaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma comissão encontrada no período
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Faturado</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionData?.summaries.map((summary) => {
                  const config = statusConfig[summary.status];
                  const StatusIcon = config.icon;

                  return (
                    <TableRow key={summary.barber_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={summary.barber_avatar || undefined} />
                            <AvatarFallback className="bg-gold/20 text-gold text-xs">
                              {getInitials(summary.barber_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{summary.barber_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {summary.commission_rate}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(summary.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gold">
                        {formatCurrency(summary.commission_amount)}
                      </TableCell>
                      <TableCell className="text-right text-green-500">
                        {formatCurrency(summary.amount_paid)}
                      </TableCell>
                      <TableCell className="text-right text-orange-500">
                        {formatCurrency(summary.pending_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {summary.status !== "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePayClick(summary)}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription>
              Pagamentos realizados recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paid_at
                        ? format(new Date(payment.paid_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={payment.barbers?.avatar_url || undefined}
                          />
                          <AvatarFallback className="bg-gold/20 text-gold text-xs">
                            {getInitials(payment.barbers?.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        {payment.barbers?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.period_start), "dd/MM", {
                        locale: ptBR,
                      })}{" "}
                      -{" "}
                      {format(new Date(payment.period_end), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-500">
                      {formatCurrency(payment.amount_paid)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pay Dialog */}
      <PayCommissionDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        barber={selectedBarberForPayment}
        periodStart={filters.startDate}
        periodEnd={filters.endDate}
      />
    </div>
  );
}
