import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Quanto tempo leva para configurar minha barbearia?",
    answer: "Menos de 10 minutos! Basta criar sua conta, cadastrar seus serviços e barbeiros, e pronto. Seu link de agendamento já estará funcionando."
  },
  {
    question: "Preciso instalar algum aplicativo?",
    answer: "Não! O InfoBarber funciona 100% no navegador. Seus clientes agendam pelo link da sua barbearia, sem precisar baixar nada. Você também acessa o painel de qualquer dispositivo."
  },
  {
    question: "Como funcionam os lembretes por WhatsApp?",
    answer: "Configuramos lembretes automáticos que são enviados 24h e 1h antes do horário agendado. Isso reduz as faltas em até 70% e seus clientes adoram a praticidade."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Não temos fidelidade ou multa de cancelamento. Você pode fazer upgrade, downgrade ou cancelar seu plano quando quiser, direto no painel."
  },
  {
    question: "E se eu precisar de ajuda?",
    answer: "Nossa equipe de suporte está disponível por chat, email e até whatsapp, de acordo com seu plano. Clientes do plano Profissional têm suporte prioritário, e do Elite têm um gerente de conta dedicado."
  },
  {
    question: "Vocês oferecem período de teste?",
    answer: "Melhor que isso! Os planos Profissional e Elite possuem acesso gratuito de 7 dias. Você pode experimentar todas as funcionalidades básicas sem pagar nada nesse periodo e fazer upgrade quando terminar o prazo."
  }
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o InfoBarber.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-gold/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-gold transition-colors py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
