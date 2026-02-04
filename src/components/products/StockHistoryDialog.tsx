import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDown, ArrowUp, Clock, Package, Plus, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProductStockMovements, useCreateStockMovement } from "@/hooks/useStockMovements";
import { Product } from "@/hooks/useProducts";

interface StockHistoryDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockHistoryDialog({ product, open, onOpenChange }: StockHistoryDialogProps) {
  const { data: movements, isLoading } = useProductStockMovements(product?.id || null);
  const createMovement = useCreateStockMovement();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [movementType, setMovementType] = useState<"entry" | "adjustment">("entry");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    await createMovement.mutateAsync({
      product_id: product.id,
      movement_type: movementType,
      quantity: parseInt(quantity),
      reason,
    });

    setShowAddForm(false);
    setQuantity("");
    setReason("");
    setMovementType("entry");
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "entry":
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case "exit":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "adjustment":
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "entry":
        return "Entrada";
      case "exit":
        return "Saída";
      case "adjustment":
        return "Ajuste";
      default:
        return type;
    }
  };

  const getMovementBadgeVariant = (type: string) => {
    switch (type) {
      case "entry":
        return "default";
      case "exit":
        return "destructive";
      case "adjustment":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Histórico de Estoque - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 px-1 bg-muted/50 rounded-lg">
          <div>
            <span className="text-sm text-muted-foreground">Estoque atual:</span>
            <span className="ml-2 text-lg font-bold">{product.stock_quantity} unidades</span>
          </div>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <Select 
                value={movementType} 
                onValueChange={(v: "entry" | "adjustment") => setMovementType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-green-500" />
                      Entrada (adicionar ao estoque)
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-yellow-500" />
                      Ajuste (pode ser + ou -)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {movementType === "entry" ? "Quantidade a adicionar" : "Quantidade (use negativo para remover)"}
              </Label>
              <Input
                id="quantity"
                type="number"
                min={movementType === "entry" ? "1" : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={movementType === "entry" ? "Ex: 10" : "Ex: -5 ou 10"}
                required
              />
              {movementType === "adjustment" && quantity && (
                <p className="text-xs text-muted-foreground">
                  Novo estoque: {Math.max(0, product.stock_quantity + parseInt(quantity || "0"))} unidades
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Reposição de estoque, Inventário, Devolução..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createMovement.isPending || !quantity}
              >
                {createMovement.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </form>
        )}

        <Separator />

        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : movements?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mb-2" />
              <p>Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements?.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {getMovementIcon(movement.movement_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getMovementBadgeVariant(movement.movement_type) as any}>
                        {getMovementLabel(movement.movement_type)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {movement.movement_type === "exit" ? "-" : "+"}
                        {Math.abs(movement.quantity)} un.
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {movement.previous_quantity} → {movement.new_quantity} unidades
                    </div>
                    {movement.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {movement.reason}
                      </p>
                    )}
                    {movement.reference_type === "product_sale" && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Venda de produto
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {format(new Date(movement.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    <br />
                    {format(new Date(movement.created_at), "HH:mm", { locale: ptBR })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
