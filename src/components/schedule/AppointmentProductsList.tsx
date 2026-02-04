import { Package, Trash2, CheckCircle, XCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppointmentProductSales, useDeleteProductSale, ProductSale } from "@/hooks/useProductSales";
import { useState } from "react";
import { AddProductDialog } from "./AddProductDialog";

interface AppointmentProductsListProps {
  appointmentId: string;
  barberId: string;
  barberCommissionRate: number;
  canEdit: boolean;
}

export function AppointmentProductsList({
  appointmentId,
  barberId,
  barberCommissionRate,
  canEdit,
}: AppointmentProductsListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: sales = [], isLoading } = useAppointmentProductSales(appointmentId);
  const deleteSale = useDeleteProductSale();

  const totalProducts = sales.reduce((sum, sale) => sum + sale.total_price, 0);

  const handleDelete = (saleId: string) => {
    if (confirm("Remover este produto da venda?")) {
      deleteSale.mutate(saleId);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <Separator className="bg-border/50 mb-4" />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground flex items-center gap-2 font-medium">
          <Package className="w-4 h-4" />
          Produtos Vendidos
        </span>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      {sales.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum produto vendido neste atendimento
        </p>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <ProductSaleItem
              key={sale.id}
              sale={sale}
              onDelete={() => handleDelete(sale.id)}
              canEdit={canEdit}
            />
          ))}
          
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="font-medium">Total Produtos:</span>
            <span className="font-semibold text-gold">
              R$ {totalProducts.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        appointmentId={appointmentId}
        barberId={barberId}
        barberCommissionRate={barberCommissionRate}
      />
    </div>
  );
}

function ProductSaleItem({
  sale,
  onDelete,
  canEdit,
}: {
  sale: ProductSale;
  onDelete: () => void;
  canEdit: boolean;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{sale.product?.name}</span>
            <span className="text-sm text-muted-foreground">
              {sale.quantity}x R$ {sale.unit_price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {sale.has_commission ? (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Com comissão ({sale.commission_rate}%)
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Sem comissão
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">R$ {sale.total_price.toFixed(2)}</span>
          {canEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
