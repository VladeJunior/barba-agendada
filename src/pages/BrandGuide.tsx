import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";
import infobarberLogo from "@/assets/infobarber-logo.png";

const colors = [
  {
    name: "Dourado (Principal)",
    hex: "#D4A21C",
    hsl: "43° 74% 49%",
    rgb: "212, 162, 28",
    usage: "Botões, links, destaques, acentos",
  },
  {
    name: "Dourado Claro",
    hex: "#E8C95C",
    hsl: "43° 80% 65%",
    rgb: "232, 201, 92",
    usage: "Hovers, gradientes, destaques suaves",
  },
  {
    name: "Dourado Escuro",
    hex: "#986F12",
    hsl: "43° 70% 35%",
    rgb: "152, 111, 18",
    usage: "Ênfase, sombras, bordas",
  },
  {
    name: "Preto (Background)",
    hex: "#0A0A0A",
    hsl: "0° 0% 4%",
    rgb: "10, 10, 10",
    usage: "Fundo principal",
  },
  {
    name: "Carvão",
    hex: "#1A1A1A",
    hsl: "0° 0% 10%",
    rgb: "26, 26, 26",
    usage: "Cards, elementos secundários",
  },
  {
    name: "Texto Principal",
    hex: "#E8E6E3",
    hsl: "40° 6% 90%",
    rgb: "232, 230, 227",
    usage: "Texto sobre fundo escuro",
  },
];

const typography = [
  {
    name: "Playfair Display",
    usage: "Títulos, headlines, destaques",
    weights: "400, 500, 600, 700",
    style: "Serif, elegante, sofisticado",
    googleFont: "https://fonts.google.com/specimen/Playfair+Display",
  },
  {
    name: "Inter",
    usage: "Corpo de texto, botões, UI",
    weights: "300, 400, 500, 600, 700",
    style: "Sans-serif, moderno, legível",
    googleFont: "https://fonts.google.com/specimen/Inter",
  },
];

export default function BrandGuide() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const copyToClipboard = (text: string, colorName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(colorName);
    toast.success(`${colorName} copiado!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Background color (dark)
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Header
      pdf.setTextColor(232, 230, 227);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text("InfoBarber", margin, yPosition + 10);
      
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(140, 140, 140);
      pdf.text("Guia de Identidade Visual", margin, yPosition + 20);
      
      yPosition += 40;

      // Divider line (gold)
      pdf.setDrawColor(212, 162, 28);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Typography Section
      pdf.setTextColor(212, 162, 28);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Tipografia", margin, yPosition);
      yPosition += 12;

      typography.forEach((font) => {
        pdf.setTextColor(232, 230, 227);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(font.name, margin, yPosition);
        yPosition += 6;
        
        pdf.setTextColor(140, 140, 140);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Uso: ${font.usage}`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Pesos: ${font.weights}`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Estilo: ${font.style}`, margin, yPosition);
        yPosition += 12;
      });

      yPosition += 5;

      // Colors Section
      pdf.setTextColor(212, 162, 28);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Paleta de Cores", margin, yPosition);
      yPosition += 12;

      const colorBoxSize = 15;
      const colorSpacing = 5;
      
      colors.forEach((color) => {
        // Color box
        const rgb = color.rgb.split(", ").map(Number);
        pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
        pdf.roundedRect(margin, yPosition - 4, colorBoxSize, colorBoxSize, 2, 2, "F");
        
        // Color info
        pdf.setTextColor(232, 230, 227);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(color.name, margin + colorBoxSize + colorSpacing, yPosition);
        
        pdf.setTextColor(140, 140, 140);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(`HEX: ${color.hex}  |  HSL: ${color.hsl}`, margin + colorBoxSize + colorSpacing, yPosition + 5);
        pdf.text(`Uso: ${color.usage}`, margin + colorBoxSize + colorSpacing, yPosition + 10);
        
        yPosition += 20;
      });

      // Check if we need a new page for gradients
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        pdf.setFillColor(10, 10, 10);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        yPosition = margin;
      }

      yPosition += 10;

      // Gradients Section
      pdf.setTextColor(212, 162, 28);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Gradientes", margin, yPosition);
      yPosition += 12;

      pdf.setTextColor(232, 230, 227);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Gradiente Dourado", margin, yPosition);
      yPosition += 6;

      pdf.setTextColor(140, 140, 140);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("linear-gradient(135deg, #D4A21C, #E8C95C)", margin, yPosition);
      yPosition += 15;

      // Footer
      pdf.setTextColor(140, 140, 140);
      pdf.setFontSize(8);
      pdf.text(`InfoBarber Brand Guide - Gerado em ${new Date().toLocaleDateString("pt-BR")}`, margin, pageHeight - 10);

      // Save the PDF
      pdf.save("InfoBarber-Brand-Guide.pdf");
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Guia de Marca
              </h1>
              <p className="text-muted-foreground">
                Identidade visual InfoBarber
              </p>
            </div>
          </div>
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating}
            className="bg-gold hover:bg-gold-dark text-primary-foreground"
          >
            {isGenerating ? (
              <>Gerando...</>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </>
            )}
          </Button>
        </div>

        {/* Logo Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-gold">Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-background p-8 rounded-lg border border-border">
                <img 
                  src={infobarberLogo} 
                  alt="InfoBarber Logo" 
                  className="h-24 w-auto"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  InfoBarber
                </h3>
                <p className="text-muted-foreground">
                  Use a logo em fundo escuro para máximo impacto visual.
                  Mantenha área de respiro ao redor da logo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-gold">Tipografia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {typography.map((font) => (
                <div 
                  key={font.name}
                  className="p-6 rounded-lg bg-muted/30 border border-border"
                >
                  <h3 
                    className="text-2xl font-bold text-foreground mb-2"
                    style={{ fontFamily: font.name === "Playfair Display" ? "'Playfair Display', serif" : "'Inter', sans-serif" }}
                  >
                    {font.name}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Uso:</span> {font.usage}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Pesos:</span> {font.weights}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Estilo:</span> {font.style}
                    </p>
                    <a 
                      href={font.googleFont}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold-light underline text-xs"
                    >
                      Baixar no Google Fonts →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Colors Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-gold">Paleta de Cores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {colors.map((color) => (
                <div 
                  key={color.name}
                  className="rounded-lg overflow-hidden border border-border"
                >
                  <div 
                    className="h-20 w-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="p-4 bg-muted/30">
                    <h4 className="font-semibold text-foreground mb-2">
                      {color.name}
                    </h4>
                    <div className="space-y-1 text-xs">
                      <button
                        onClick={() => copyToClipboard(color.hex, color.name)}
                        className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>HEX: {color.hex}</span>
                        {copiedColor === color.name ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <p className="text-muted-foreground">HSL: {color.hsl}</p>
                      <p className="text-muted-foreground">RGB: {color.rgb}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {color.usage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gradients Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gold">Gradientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border">
              <div 
                className="h-24 w-full"
                style={{ background: "linear-gradient(135deg, #D4A21C, #E8C95C)" }}
              />
              <div className="p-4 bg-muted/30">
                <h4 className="font-semibold text-foreground mb-2">
                  Gradiente Dourado
                </h4>
                <button
                  onClick={() => copyToClipboard("linear-gradient(135deg, #D4A21C, #E8C95C)", "Gradiente")}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <code className="bg-muted px-2 py-1 rounded">
                    linear-gradient(135deg, #D4A21C, #E8C95C)
                  </code>
                  {copiedColor === "Gradiente" ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
