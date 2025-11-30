import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Análise de desempenho da sua barbearia</p>
      </div>

      <Card variant="elevated">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Em breve</p>
          <p className="text-sm text-muted-foreground">
            Relatórios detalhados de faturamento, serviços mais populares e mais
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
