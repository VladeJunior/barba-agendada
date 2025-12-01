import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useBarberPortfolio, useUploadPortfolioImage, useDeletePortfolioImage } from "@/hooks/useBarberPortfolio";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface PortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  barberName: string;
}

export function PortfolioDialog({
  open,
  onOpenChange,
  barberId,
  barberName,
}: PortfolioDialogProps) {
  const { data: portfolio, isLoading } = useBarberPortfolio(barberId);
  const uploadImage = useUploadPortfolioImage(barberId);
  const deleteImage = useDeletePortfolioImage(barberId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadImage.mutateAsync({
      file: selectedFile,
      description: description.trim() || undefined,
    });

    setSelectedFile(null);
    setDescription("");
    setPreviewUrl(null);
  };

  const handleDelete = async (imageId: string) => {
    if (confirm("Tem certeza que deseja remover esta imagem?")) {
      await deleteImage.mutateAsync(imageId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portfólio de {barberName}</DialogTitle>
          <DialogDescription>
            Gerencie as fotos dos trabalhos realizados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="portfolio-image">Adicionar nova foto</Label>
                  <Input
                    id="portfolio-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 10MB. Formatos: JPG, PNG, WEBP
                  </p>
                </div>

                {previewUrl && (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                    <div>
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Input
                        id="description"
                        placeholder="Ex: Corte degradê com desenho"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={uploadImage.isPending}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadImage.isPending ? "Enviando..." : "Adicionar ao Portfólio"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gallery Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Galeria ({portfolio?.length || 0} fotos)
            </h3>

            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            )}

            {portfolio && portfolio.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolio.map((image) => (
                  <Card key={image.id} className="overflow-hidden group relative">
                    <div className="aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.description || "Trabalho"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {image.description && (
                      <CardContent className="pt-2 pb-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {image.description}
                        </p>
                      </CardContent>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              !isLoading && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nenhuma foto adicionada ainda
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
