import { useState } from "react";
import { Plus, Pencil, Trash2, Package, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  Product,
} from "@/hooks/useProducts";
import { StockHistoryDialog } from "@/components/products/StockHistoryDialog";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  cost_price: string;
  sku: string;
  image_url: string;
  track_stock: boolean;
  stock_quantity: string;
  min_stock_alert: string;
  is_active: boolean;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  price: "",
  cost_price: "",
  sku: "",
  image_url: "",
  track_stock: false,
  stock_quantity: "0",
  min_stock_alert: "",
  is_active: true,
};

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [stockHistoryProduct, setStockHistoryProduct] = useState<Product | null>(null);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        cost_price: product.cost_price?.toString() || "",
        sku: product.sku || "",
        image_url: product.image_url || "",
        track_stock: product.track_stock,
        stock_quantity: product.stock_quantity.toString(),
        min_stock_alert: product.min_stock_alert?.toString() || "",
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      sku: formData.sku || null,
      image_url: formData.image_url || null,
      track_stock: formData.track_stock,
      stock_quantity: formData.track_stock ? parseInt(formData.stock_quantity) : 0,
      min_stock_alert: formData.track_stock && formData.min_stock_alert
        ? parseInt(formData.min_stock_alert)
        : null,
      is_active: formData.is_active,
    };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
    } else {
      await createProduct.mutateAsync(productData);
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id);
  };

  const getStockStatus = (product: Product): { label: string; variant: "success" | "warning" | "destructive" } | null => {
    if (!product.track_stock) return null;

    const quantity = product.stock_quantity;
    const minAlert = product.min_stock_alert || 0;

    if (quantity === 0) {
      return { label: "Sem estoque", variant: "destructive" };
    }
    if (quantity <= minAlert) {
      return { label: `${quantity} un.`, variant: "warning" };
    }
    return { label: `${quantity} un.`, variant: "success" };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos da sua barbearia</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do produto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço de Venda *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Preço de Custo</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">Código/SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Código do produto"
                />
              </div>

              <div className="space-y-2">
                <ImageUpload
                  label="Imagem do Produto"
                  bucket="product-images"
                  path="products"
                  currentImageUrl={formData.image_url || null}
                  onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-b border-border">
                <div>
                  <Label htmlFor="track_stock">Controlar Estoque</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar controle de quantidade em estoque
                  </p>
                </div>
                <Switch
                  id="track_stock"
                  checked={formData.track_stock}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, track_stock: checked })
                  }
                />
              </div>

              {formData.track_stock && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stock_quantity: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock_alert">Alerta de Estoque Mínimo</Label>
                    <Input
                      id="min_stock_alert"
                      type="number"
                      min="0"
                      value={formData.min_stock_alert}
                      onChange={(e) =>
                        setFormData({ ...formData, min_stock_alert: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="is_active">Produto Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Produtos inativos não aparecem para clientes
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={createProduct.isPending || updateProduct.isPending}
                >
                  {editingProduct ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products?.length === 0 ? (
        <Card variant="elevated" className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando seu primeiro produto ao catálogo.
            </p>
            <Button onClick={() => handleOpenDialog()} variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products?.map((product) => {
            const stockStatus = getStockStatus(product);

            return (
              <Card key={product.id} variant="elevated" className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-gold ml-2">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}

                  {stockStatus && (
                    <div className="mb-3">
                      <Badge
                        variant={stockStatus.variant === "destructive" ? "destructive" : "default"}
                        className={
                          stockStatus.variant === "success"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : stockStatus.variant === "warning"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : ""
                        }
                      >
                        Estoque: {stockStatus.label}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    {product.track_stock && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStockHistoryProduct(product)}
                        title="Histórico de estoque"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{product.name}"? Esta ação não
                            pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <StockHistoryDialog
        product={stockHistoryProduct}
        open={!!stockHistoryProduct}
        onOpenChange={(open) => !open && setStockHistoryProduct(null)}
      />
    </div>
  );
}
