import React from "react";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

const Privacy = () => {
  return (
    <LegalPageLayout title="Política de Privacidade" lastUpdate="Dezembro de 2025">
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quem somos</h2>
          <p>
            A <strong>InfoSage Tecnologia</strong> (InfoBarber) atua como <strong>Controladora</strong> dos dados de cadastro das barbearias e 
            <strong>Operadora</strong> dos dados dos clientes finais agendados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Dados Coletados</h2>
          <p className="mb-2">Coletamos os seguintes dados para funcionamento do sistema:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Barbearias/Profissionais:</strong> Nome, E-mail, Telefone, Senha (criptografada) e dados de pagamento (processados externamente).</li>
            <li><strong>Clientes Finais:</strong> Nome e Telefone celular.</li>
            <li><strong>Dados de Uso:</strong> Logs de acesso, histórico de agendamentos e preferências.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Finalidade do Uso dos Dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Agendamento:</strong> Permitir a reserva de horários e gestão da agenda.</li>
            <li><strong>Comunicação:</strong> Enviar lembretes automáticos de agendamento via WhatsApp (funcionalidade essencial do sistema).</li>
            <li><strong>Fidelidade:</strong> Gerenciar pontos e recompensas acumulados.</li>
            <li><strong>Melhoria:</strong> Análise de métricas para aprimorar a plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento de Dados</h2>
          <p className="mb-2">Não vendemos seus dados. Compartilhamos informações apenas com provedores essenciais para a operação:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase:</strong> Infraestrutura de banco de dados e autenticação.</li>
            <li><strong>Mercado Pago:</strong> Processamento de pagamentos e assinaturas.</li>
            <li><strong>W-API:</strong> Disparo de mensagens automatizadas no WhatsApp.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Segurança</h2>
          <p>
            Utilizamos criptografia (SSL) em todas as comunicações e seus dados são armazenados em servidores seguros com controle de acesso rigoroso (Row Level Security). 
            As senhas são protegidas por hash e não são visíveis para nossa equipe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Seus Direitos (LGPD)</h2>
          <p className="mb-2">Você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmar a existência de tratamento de dados.</li>
            <li>Acessar seus dados.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a exclusão de seus dados (Direito ao Esquecimento), ressalvadas as obrigações legais de retenção.</li>
          </ul>
          <p className="mt-4">
            Para exercer seus direitos, entre em contato através do e-mail: <strong>contato@infobarber.com.br</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
          <p>
            Utilizamos cookies e armazenamento local apenas para manter sua sessão ativa e salvar preferências de navegação.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Privacy;