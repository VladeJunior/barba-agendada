import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, Plus, Minus, AlertCircle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCreateProductSale } from "@/hooks/useProductSales";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  barberId: string;
  barberCommissionRate: number;
}

export function AddProductDialog({
  open,
  onOpenChange,
  appointmentId,
  barberId,
  barberCommissionRate,
}: AddProductDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [hasCommission, setHasCommission] = useState(false);

  const { data: products = [] } = useProducts();
  const createSale = useCreateProductSale();

  const activeProducts = useMemo(() => 
    products.filter(p => p.is_active), 
    [products]
  );

  const selectedProduct = useMemo(() => 
    activeProducts.find(p => p.id === selectedProductId),
    [activeProducts, selectedProductId]
  );

  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0;
  const commissionAmount = hasCommission ? totalPrice * (barberCommissionRate / 100) : 0;
  const hasLowStock = selectedProduct?.track_stock && selectedProduct.stock_quantity < quantity;

  const handleSubmit = () => {
    if (!selectedProduct) return;

    createSale.mutate({
      appointment_id: appointmentId,
      product_id: selectedProduct.id,
      barber_id: barberId,
      quantity,
      unit_price: selectedProduct.price,
      total_price: totalPrice,
      has_commission: hasCommission,
      commission_rate: hasCommission ? barberCommissionRate : 0,
      commission_amount: commissionAmount,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setSelectedProductId("");
    setQuantity(1);
    setHasCommission(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Adicionar Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Select */}
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        R$ {product.price.toFixed(2)}
                        {product.track_stock && ` (${product.stock_quantity} em estoque)`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {hasLowStock && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Estoque insuficiente ({selectedProduct?.stock_quantity} disponível)
              </p>
            )}
          </div>

          {/* Total Price */}
          {selectedProduct && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço unitário:</span>
                <span>R$ {selectedProduct.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-gold">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Commission Switch */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="commission-switch" className="cursor-pointer">
                Gera comissão para o barbeiro
              </Label>
              <Switch
                id="commission-switch"
                checked={hasCommission}
                onCheckedChange={setHasCommission}
              />
            </div>
            {hasCommission && selectedProduct && (
              <div className="text-sm text-muted-foreground">
                Taxa: {barberCommissionRate}% = <span className="text-gold font-medium">R$ {commissionAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground"
            onClick={handleSubmit}
            disabled={!selectedProduct || createSale.isPending || hasLowStock}
          >
            {createSale.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
