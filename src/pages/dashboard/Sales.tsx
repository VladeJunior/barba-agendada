import { useState, useMemo } from "react";
import { ShoppingCart, Search, Package, Plus, Minus, Trash2, User, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, Product } from "@/hooks/useProducts";
import { useBarbers } from "@/hooks/useBarbers";
import { useCreateProductSale, CreateProductSaleInput } from "@/hooks/useProductSales";

interface CartItem {
  product: Product;
  quantity: number;
  hasCommission: boolean;
  barberId: string | null;
  commissionRate: number;
}

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credito", label: "Cartão de Crédito" },
  { value: "debito", label: "Cartão de Débito" },
];

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: barbers = [] } = useBarbers();
  const createSale = useCreateProductSale();

  const activeProducts = useMemo(() => 
    products.filter(p => p.is_active),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return activeProducts;
    const term = searchTerm.toLowerCase();
    return activeProducts.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term)
    );
  }, [activeProducts, searchTerm]);

  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const totalCommission = useMemo(() => 
    cart.reduce((sum, item) => {
      if (item.hasCommission && item.barberId) {
        const barber = barbers.find(b => b.id === item.barberId);
        const rate = barber?.commission_rate || 0;
        return sum + (item.product.price * item.quantity * rate / 100);
      }
      return sum;
    }, 0),
    [cart, barbers]
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        product, 
        quantity: 1, 
        hasCommission: false, 
        barberId: null,
        commissionRate: 0,
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCommission = (productId: string, hasCommission: boolean, barberId: string | null) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const barber = barberId ? barbers.find(b => b.id === barberId) : null;
        return { 
          ...item, 
          hasCommission, 
          barberId,
          commissionRate: barber?.commission_rate || 0,
        };
      }
      return item;
    }));
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    const sales: CreateProductSaleInput[] = cart.map(item => {
      const barber = item.barberId ? barbers.find(b => b.id === item.barberId) : null;
      const commissionRate = barber?.commission_rate || 0;
      const totalPrice = item.product.price * item.quantity;
      const commissionAmount = item.hasCommission ? totalPrice * (commissionRate / 100) : 0;

      return {
        product_id: item.product.id,
        barber_id: item.barberId,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: totalPrice,
        has_commission: item.hasCommission,
        commission_rate: item.hasCommission ? commissionRate : 0,
        commission_amount: commissionAmount,
        client_name: clientName || null,
        client_phone: clientPhone || null,
        payment_method: paymentMethod || null,
        notes: notes || null,
      };
    });

    createSale.mutate(sales, {
      onSuccess: () => {
        setCart([]);
        setClientName("");
        setClientPhone("");
        setPaymentMethod("");
        setNotes("");
      },
    });
  };

  const hasLowStock = (product: Product, quantity: number) => 
    product.track_stock && product.stock_quantity < quantity;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-gold" />
          Ponto de Venda
        </h1>
        <p className="text-muted-foreground">
          Realize vendas de produtos avulsas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addToCart(product)}
                  inCart={cart.some(item => item.product.id === product.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho
              {cart.length > 0 && (
                <span className="ml-auto bg-gold text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Carrinho vazio
              </p>
            ) : (
              <>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {cart.map(item => (
                    <CartItemCard
                      key={item.product.id}
                      item={item}
                      barbers={barbers}
                      onUpdateQuantity={(delta) => updateQuantity(item.product.id, delta)}
                      onRemove={() => removeFromCart(item.product.id)}
                      onUpdateCommission={(hasCommission, barberId) => 
                        updateCommission(item.product.id, hasCommission, barberId)
                      }
                      hasLowStock={hasLowStock(item.product, item.quantity)}
                    />
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {/* Client Info */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Cliente (opcional)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Telefone"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(pm => (
                          <SelectItem key={pm.value} value={pm.value}>
                            {pm.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Totals */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    {totalCommission > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Comissões:</span>
                        <span className="text-gold">R$ {totalCommission.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                      <span>Total:</span>
                      <span className="text-gold">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gold hover:bg-gold/90 text-primary-foreground"
                    size="lg"
                    onClick={handleFinalizeSale}
                    disabled={createSale.isPending || cart.some(item => hasLowStock(item.product, item.quantity))}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {createSale.isPending ? "Processando..." : "Finalizar Venda"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProductCard({ 
  product, 
  onAdd, 
  inCart 
}: { 
  product: Product; 
  onAdd: () => void; 
  inCart: boolean;
}) {
  const outOfStock = product.track_stock && product.stock_quantity <= 0;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:border-gold/50 ${inCart ? 'border-gold' : ''} ${outOfStock ? 'opacity-50' : ''}`}
      onClick={() => !outOfStock && onAdd()}
    >
      <CardContent className="p-3">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-24 object-cover rounded-md mb-2"
          />
        ) : (
          <div className="w-full h-24 bg-muted rounded-md mb-2 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <h3 className="font-medium text-sm truncate">{product.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gold font-semibold">R$ {product.price.toFixed(2)}</span>
          {product.track_stock && (
            <span className={`text-xs ${product.stock_quantity <= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {product.stock_quantity} un
            </span>
          )}
        </div>
        {inCart && (
          <div className="mt-2 text-xs text-center text-gold font-medium">
            No carrinho
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CartItemCard({
  item,
  barbers,
  onUpdateQuantity,
  onRemove,
  onUpdateCommission,
  hasLowStock,
}: {
  item: CartItem;
  barbers: Array<{ id: string; name: string; commission_rate: number | null }>;
  onUpdateQuantity: (delta: number) => void;
  onRemove: () => void;
  onUpdateCommission: (hasCommission: boolean, barberId: string | null) => void;
  hasLowStock: boolean;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
          <p className="text-xs text-muted-foreground">
            R$ {item.product.price.toFixed(2)} cada
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6"
            onClick={() => onUpdateQuantity(-1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6"
            onClick={() => onUpdateQuantity(1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <span className="font-semibold text-sm">
          R$ {(item.product.price * item.quantity).toFixed(2)}
        </span>
      </div>

      {hasLowStock && (
        <p className="text-xs text-destructive">
          Estoque insuficiente ({item.product.stock_quantity} disponível)
        </p>
      )}

      {/* Commission Toggle */}
      <div className="pt-2 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`commission-${item.product.id}`} className="text-xs cursor-pointer">
            Comissão
          </Label>
          <Switch
            id={`commission-${item.product.id}`}
            checked={item.hasCommission}
            onCheckedChange={(checked) => onUpdateCommission(checked, checked ? item.barberId : null)}
          />
        </div>
        {item.hasCommission && (
          <Select
            value={item.barberId || ""}
            onValueChange={(value) => onUpdateCommission(true, value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecione barbeiro" />
            </SelectTrigger>
            <SelectContent>
              {barbers.map(barber => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name} ({barber.commission_rate || 0}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
