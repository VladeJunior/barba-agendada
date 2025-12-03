import React, { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
// Remova o import ScrollArea se não estiver sendo usado para envolver o conteúdo principal, 
// ou mantenha se estiver usando internamente, mas o window.scrollTo é o principal aqui.

interface LegalPageLayoutProps {
  title: string;
  lastUpdate: string;
  children: React.ReactNode;
}

const LegalPageLayout = ({ title, lastUpdate, children }: LegalPageLayoutProps) => {
  // ✅ Adicione este efeito para rolar para o topo ao montar o componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header do Documento */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Última atualização: {lastUpdate}
            </p>
          </div>

          {/* Conteúdo do Documento */}
          <div className="prose prose-blue max-w-none text-gray-600">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;