import React from "react";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

const Terms = () => {
  return (
    <LegalPageLayout title="Termos de Uso" lastUpdate="Dezembro de 2025">
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma <strong>InfoBarber</strong>, desenvolvida pela <strong>InfoSage Tecnologia</strong>, 
            você concorda em cumprir estes Termos de Uso e todas as leis aplicáveis. Se você não concordar com algum destes termos, 
            está proibido de usar ou acessar este site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrição do Serviço</h2>
          <p className="mb-2">O InfoBarber é uma plataforma SaaS (Software as a Service) que oferece:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gestão de agendamentos e horários para barbearias.</li>
            <li>Ferramentas de fidelidade e gestão de clientes.</li>
            <li>Automação de lembretes via WhatsApp.</li>
            <li>Dashboards administrativos e financeiros.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Contas e Cadastro</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Responsabilidade:</strong> Você é responsável por manter a confidencialidade de sua conta e senha.
            </li>
            <li>
              <strong>Dados Reais:</strong> Você concorda em fornecer informações verdadeiras, exatas e atuais durante o cadastro.
            </li>
            <li>
              <strong>Tipos de Usuário:</strong>
              <ul className="list-circle pl-5 mt-1 space-y-1">
                <li><strong>Owner (Dono):</strong> Responsável pelo pagamento da assinatura e gestão da barbearia.</li>
                <li><strong>Barber (Profissional):</strong> Usuário vinculado a uma barbearia, sujeito às regras do estabelecimento.</li>
                <li><strong>Cliente Final:</strong> Usuário que utiliza a plataforma apenas para realizar agendamentos públicos.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Assinaturas e Pagamentos</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Planos:</strong> O serviço é oferecido em planos (Essencial, Profissional, Elite) com diferentes limites de recursos.
            </li>
            <li>
              <strong>Pagamento:</strong> Os pagamentos são processados via Mercado Pago. O não pagamento pode resultar na suspensão do acesso ao Dashboard.
            </li>
            <li>
              <strong>Cancelamento:</strong> O cancelamento pode ser feito a qualquer momento, interrompendo a renovação automática para o ciclo seguinte. Não há reembolso para períodos parciais não utilizados.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Uso Aceitável</h2>
          <p className="mb-2">É estritamente proibido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Usar o sistema para enviar SPAM ou mensagens não solicitadas via WhatsApp.</li>
            <li>Tentar acessar áreas não autorizadas do sistema (hacking).</li>
            <li>Revender ou sublicenciar o software sem autorização da InfoSage Tecnologia.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitação de Responsabilidade</h2>
          <p className="mb-2">A InfoSage Tecnologia não se responsabiliza por:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>No-shows:</strong> Faltas de clientes aos agendamentos, embora o sistema forneça ferramentas para mitigá-las.</li>
            <li><strong>Instabilidade de Terceiros:</strong> Falhas no serviço de WhatsApp (W-API) ou Mercado Pago que fujam ao nosso controle.</li>
            <li><strong>Dados Incorretos:</strong> Erros de agendamento causados por dados cadastrados incorretamente pelo usuário.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Suporte</h2>
          <p>
            O suporte é oferecido conforme o plano contratado, através dos canais oficiais (Chat no Dashboard ou WhatsApp) em horário comercial.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Terms;