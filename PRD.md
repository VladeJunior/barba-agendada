# InfoBarber - Product Requirements Document (PRD)

**Versão:** 2.0  
**Data:** Dezembro 2024  
**Autor:** InfoSage Tecnologia  
**Status:** Em Produção

---

## 📋 Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Objetivos e Métricas de Sucesso](#2-objetivos-e-métricas-de-sucesso)
3. [Público-Alvo](#3-público-alvo)
4. [Personas](#4-personas)
5. [Requisitos Funcionais](#5-requisitos-funcionais)
6. [Requisitos Não-Funcionais](#6-requisitos-não-funcionais)
7. [User Stories](#7-user-stories)
8. [Arquitetura do Sistema](#8-arquitetura-do-sistema)
9. [Modelo de Negócio](#9-modelo-de-negócio)
10. [Roadmap](#10-roadmap)
11. [Riscos e Mitigações](#11-riscos-e-mitigações)
12. [Glossário](#12-glossário)

---

## 1. Visão Geral do Produto

### 1.1 Declaração de Visão

**InfoBarber** é uma plataforma SaaS de gestão e agendamento online para barbearias, desenvolvida para simplificar a operação de estabelecimentos de pequeno e médio porte, aumentar a fidelização de clientes e maximizar o faturamento através de automação e insights inteligentes.

### 1.2 Problema a Resolver

| Problema | Impacto |
|----------|---------|
| Agendamentos por telefone/WhatsApp são ineficientes | Perda de tempo, erros de marcação, conflitos de horário |
| Alta taxa de no-show (faltas) | Perda de receita estimada em 20-30% |
| Gestão manual de equipe e comissões | Erros de cálculo, desconfiança, retrabalho |
| Falta de visibilidade sobre o negócio | Decisões baseadas em intuição, não em dados |
| Dificuldade em fidelizar clientes | Cliente não retorna, baixo lifetime value |

### 1.3 Solução Proposta

Uma plataforma integrada que oferece:
- **Agendamento online 24/7** com link personalizado por barbearia
- **Lembretes automáticos via WhatsApp** reduzindo no-shows em até 70%
- **Dashboard completo** com métricas de negócio em tempo real
- **Programa de fidelidade** integrado com pontos e recompensas
- **Gestão de equipe** com controle de comissões e agenda individual

### 1.4 Proposta de Valor Única (UVP)

> "Transforme sua barbearia em um negócio profissional com agendamento online, lembretes automáticos e programa de fidelidade - tudo em uma única plataforma."

---

## 2. Objetivos e Métricas de Sucesso

### 2.1 Objetivos de Negócio

| Objetivo | Meta | Prazo |
|----------|------|-------|
| Aquisição de clientes | 100 barbearias ativas | 6 meses |
| MRR (Monthly Recurring Revenue) | R$ 20.000 | 6 meses |
| Taxa de conversão trial → pago | > 40% | Contínuo |
| Churn rate mensal | < 5% | Contínuo |
| NPS (Net Promoter Score) | > 50 | Trimestral |

### 2.2 Métricas de Produto (KPIs)

| Métrica | Descrição | Meta |
|---------|-----------|------|
| DAU/MAU | Engajamento diário vs mensal | > 30% |
| Agendamentos/barbearia/mês | Volume de uso | > 50 |
| Taxa de no-show | Faltas com lembretes ativos | < 10% |
| Tempo médio de onboarding | Primeiro agendamento | < 24h |
| Tickets de suporte/cliente | Qualidade do produto | < 2/mês |

---

## 3. Público-Alvo

### 3.1 Mercado-Alvo

- **Geografia:** Brasil (inicialmente SP, expansão nacional)
- **Segmento:** Barbearias de pequeno e médio porte
- **Tamanho:** 1 a 10 barbeiros por estabelecimento
- **Faturamento:** R$ 5.000 a R$ 100.000/mês

### 3.2 Características do Público

| Característica | Perfil |
|----------------|--------|
| Idade do proprietário | 25-50 anos |
| Familiaridade com tecnologia | Baixa a média |
| Principal canal de comunicação | WhatsApp |
| Dor principal | Gestão de tempo e agendamentos |
| Disposição para pagar | R$ 100-300/mês por solução completa |

---

## 4. Personas

### 4.1 Persona Primária: Carlos (Dono de Barbearia)

| Atributo | Descrição |
|----------|-----------|
| **Nome** | Carlos Silva |
| **Idade** | 35 anos |
| **Cargo** | Proprietário e barbeiro |
| **Barbearia** | 3 barbeiros, 150 clientes/mês |
| **Dores** | Agenda bagunçada, clientes faltam, não sabe quanto fatura |
| **Objetivos** | Profissionalizar o negócio, ter mais tempo livre, crescer |
| **Comportamento** | Usa WhatsApp o dia todo, pouco tempo para aprender sistemas |
| **Quote** | "Preciso de algo simples que funcione no meu celular" |

### 4.2 Persona Secundária: João (Barbeiro Funcionário)

| Atributo | Descrição |
|----------|-----------|
| **Nome** | João Mendes |
| **Idade** | 28 anos |
| **Cargo** | Barbeiro comissionado |
| **Dores** | Não sabe quanto vai receber, agenda confusa |
| **Objetivos** | Ter controle da própria agenda e comissões |
| **Comportamento** | Tech-savvy, quer ver números claros |
| **Quote** | "Quero saber minha comissão sem ter que perguntar" |

### 4.3 Persona Terciária: Pedro (Cliente)

| Atributo | Descrição |
|----------|-----------|
| **Nome** | Pedro Costa |
| **Idade** | 32 anos |
| **Cargo** | Profissional liberal |
| **Dores** | Não consegue ligar para agendar, esquece horários |
| **Objetivos** | Agendar rápido, ser lembrado, ter benefícios |
| **Comportamento** | Agenda pelo celular, prefere não ligar |
| **Quote** | "Quero agendar em 2 cliques e receber lembrete" |

---

## 5. Requisitos Funcionais

### 5.1 Módulo: Autenticação e Cadastro

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| AUTH-01 | Cadastro de nova barbearia com email/senha | Alta | ✅ Implementado |
| AUTH-02 | Login com email/senha | Alta | ✅ Implementado |
| AUTH-03 | Recuperação de senha | Alta | ✅ Implementado |
| AUTH-04 | Auto-confirmação de email (desenvolvimento) | Alta | ✅ Implementado |
| AUTH-05 | Roles diferenciados (owner, barber, client, super_admin) | Alta | ✅ Implementado |

### 5.2 Módulo: Gestão de Serviços

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| SVC-01 | CRUD de serviços (nome, preço, duração) | Alta | ✅ Implementado |
| SVC-02 | Ativar/desativar serviços | Média | ✅ Implementado |
| SVC-03 | Descrição opcional do serviço | Baixa | ✅ Implementado |
| SVC-04 | Ordenação de serviços | Baixa | 🔜 Backlog |

### 5.3 Módulo: Gestão de Equipe

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| TEAM-01 | CRUD de barbeiros | Alta | ✅ Implementado |
| TEAM-02 | Upload de avatar do barbeiro | Média | ✅ Implementado |
| TEAM-03 | Configuração de taxa de comissão | Alta | ✅ Implementado |
| TEAM-04 | Configuração de horários de trabalho por dia | Alta | ✅ Implementado |
| TEAM-05 | Bloqueio de horários (férias, folgas) | Alta | ✅ Implementado |
| TEAM-06 | Convite de barbeiro via WhatsApp | Alta | ✅ Implementado |
| TEAM-07 | Vinculação de barbeiro a conta de usuário | Alta | ✅ Implementado |
| TEAM-08 | Gestão de portfólio do barbeiro | Média | ✅ Implementado |
| TEAM-09 | Bio/descrição do barbeiro | Baixa | ✅ Implementado |

### 5.4 Módulo: Agendamento Online

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| BOOK-01 | URL personalizada por barbearia (/agendar/:slug) | Alta | ✅ Implementado |
| BOOK-02 | Seleção de serviço | Alta | ✅ Implementado |
| BOOK-03 | Seleção de barbeiro com rating | Alta | ✅ Implementado |
| BOOK-04 | Calendário com disponibilidade em tempo real | Alta | ✅ Implementado |
| BOOK-05 | Respeitar horários de trabalho configurados | Alta | ✅ Implementado |
| BOOK-06 | Respeitar horários bloqueados | Alta | ✅ Implementado |
| BOOK-07 | Prevenção de double-booking | Alta | ✅ Implementado |
| BOOK-08 | Coleta de nome e telefone do cliente | Alta | ✅ Implementado |
| BOOK-09 | Confirmação de agendamento na tela | Alta | ✅ Implementado |
| BOOK-10 | Envio de confirmação via WhatsApp | Alta | ✅ Implementado |
| BOOK-11 | Aplicação de cupom de desconto no checkout | Média | ✅ Implementado |
| BOOK-12 | Agendamento sem necessidade de login | Alta | ✅ Implementado |

### 5.5 Módulo: Gestão de Agendamentos

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| APPT-01 | Visualização em calendário (dia/semana/mês) | Alta | ✅ Implementado |
| APPT-02 | Filtro por barbeiro | Média | ✅ Implementado |
| APPT-03 | Alteração de status (confirmado, concluído, cancelado, no-show) | Alta | ✅ Implementado |
| APPT-04 | Visualização de detalhes do agendamento | Alta | ✅ Implementado |
| APPT-05 | Cancelamento pelo cliente (via página pública) | Alta | ✅ Implementado |

### 5.6 Módulo: Lembretes Automáticos

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| REM-01 | Lembrete 24h antes via WhatsApp | Alta | ✅ Implementado |
| REM-02 | Lembrete 1h antes via WhatsApp | Alta | ✅ Implementado |
| REM-03 | Lembrete de última hora (5-30min) | Média | ✅ Implementado |
| REM-04 | Mensagem dinâmica com tempo restante | Média | ✅ Implementado |
| REM-05 | Tracking de lembretes enviados | Média | ✅ Implementado |
| REM-06 | Agenda diária para barbeiros (planos Pro/Elite) | Média | ✅ Implementado |

### 5.7 Módulo: Programa de Fidelidade

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| LOY-01 | Acúmulo automático de pontos (10 pts/agendamento concluído) | Alta | ✅ Implementado |
| LOY-02 | CRUD de recompensas | Alta | ✅ Implementado |
| LOY-03 | CRUD de cupons de desconto | Alta | ✅ Implementado |
| LOY-04 | Resgate de recompensa por pontos | Alta | ✅ Implementado |
| LOY-05 | Expiração configurável de pontos (1-60 meses) | Média | ✅ Implementado |
| LOY-06 | Notificação de pontos prestes a expirar | Média | ✅ Implementado |
| LOY-07 | Notificação quando elegível para recompensa | Média | ✅ Implementado |
| LOY-08 | Analytics de fidelidade | Média | ✅ Implementado |
| LOY-09 | Visualização de pontos pelo cliente | Alta | ✅ Implementado |

### 5.8 Módulo: Avaliações

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| REV-01 | Avaliação 1-5 estrelas após agendamento concluído | Alta | ✅ Implementado |
| REV-02 | Comentário opcional na avaliação | Média | ✅ Implementado |
| REV-03 | Exibição de média de avaliações no booking | Alta | ✅ Implementado |
| REV-04 | Página de perfil público do barbeiro com reviews | Média | ✅ Implementado |

### 5.9 Módulo: Relatórios e Analytics

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| REP-01 | Dashboard com KPIs principais | Alta | ✅ Implementado |
| REP-02 | Gráfico de evolução de receita | Alta | ✅ Implementado |
| REP-03 | Relatório de comissões por barbeiro | Alta | ✅ Implementado |
| REP-04 | Relatório de serviços mais populares | Média | ✅ Implementado |
| REP-05 | Mapa de calor de horários de pico | Média | ✅ Implementado |
| REP-06 | Taxa de cancelamento e no-show | Média | ✅ Implementado |
| REP-07 | Análise de clientes (frequentes, novos, top spenders) | Média | ✅ Implementado |
| REP-08 | Exportação para PDF | Média | ✅ Implementado |
| REP-09 | Exportação para Excel | Média | ✅ Implementado |
| REP-10 | Filtro por período customizado | Alta | ✅ Implementado |

### 5.10 Módulo: Configurações

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| CFG-01 | Edição de dados da barbearia (nome, endereço, telefone) | Alta | ✅ Implementado |
| CFG-02 | Upload de logo da barbearia | Média | ✅ Implementado |
| CFG-03 | Upload de capa da barbearia | Média | ✅ Implementado |
| CFG-04 | Personalização do slug de agendamento | Alta | ✅ Implementado |
| CFG-05 | Integração com WhatsApp (W-API) | Alta | ✅ Implementado |
| CFG-06 | Teste de conexão WhatsApp | Média | ✅ Implementado |
| CFG-07 | Configuração de expiração de pontos | Média | ✅ Implementado |

### 5.11 Módulo: Planos e Assinatura

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| SUB-01 | Seleção obrigatória de plano no onboarding | Alta | ✅ Implementado |
| SUB-02 | Trial de 7 dias (Profissional e Elite) | Alta | ✅ Implementado |
| SUB-03 | Limitação de barbeiros por plano | Alta | ✅ Implementado |
| SUB-04 | Upgrade/downgrade de plano | Média | ✅ Implementado |
| SUB-05 | Integração com Mercado Pago | Alta | ✅ Implementado |
| SUB-06 | Webhook para atualização automática de status | Alta | ✅ Implementado |

### 5.12 Módulo: Suporte

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| SUP-01 | Chat em tempo real com admin | Alta | ✅ Implementado |
| SUP-02 | Histórico de conversas | Média | ✅ Implementado |
| SUP-03 | Notificação sonora de novas mensagens | Média | ✅ Implementado |
| SUP-04 | Notificação do browser | Média | ✅ Implementado |
| SUP-05 | Status de conversa (aberta, pendente, fechada) | Média | ✅ Implementado |
| SUP-06 | Badge de mensagens não lidas | Média | ✅ Implementado |

### 5.13 Módulo: Painel Administrativo (Super Admin)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| ADM-01 | Dashboard com métricas da plataforma | Alta | ✅ Implementado |
| ADM-02 | Lista de todas as barbearias | Alta | ✅ Implementado |
| ADM-03 | Filtro por plano e status | Média | ✅ Implementado |
| ADM-04 | Gestão manual de assinatura | Alta | ✅ Implementado |
| ADM-05 | Visualização de pendências de pagamento | Alta | ✅ Implementado |
| ADM-06 | Envio de lembrete de cobrança via WhatsApp | Alta | ✅ Implementado |
| ADM-07 | Métricas de MRR, churn, conversão | Alta | ✅ Implementado |
| ADM-08 | Suporte a todas as barbearias | Alta | ✅ Implementado |

### 5.14 Módulo: Dashboard do Barbeiro

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| BRB-01 | Dashboard personalizado com métricas próprias | Alta | ✅ Implementado |
| BRB-02 | Visualização de agenda própria | Alta | ✅ Implementado |
| BRB-03 | Visualização de comissões | Alta | ✅ Implementado |
| BRB-04 | Atualização de status de agendamentos | Alta | ✅ Implementado |
| BRB-05 | Acesso ao suporte | Média | ✅ Implementado |

---

## 6. Requisitos Não-Funcionais

### 6.1 Performance

| Requisito | Especificação |
|-----------|---------------|
| Tempo de carregamento inicial | < 3 segundos |
| Tempo de resposta de API | < 500ms (P95) |
| Disponibilidade | 99.5% uptime |
| Suporte a usuários simultâneos | 1000+ |

### 6.2 Segurança

| Requisito | Especificação |
|-----------|---------------|
| Autenticação | Supabase Auth com JWT |
| Autorização | Row Level Security (RLS) em todas as tabelas |
| Criptografia | HTTPS obrigatório, dados em repouso criptografados |
| Roles | Segregação via tabela user_roles (não no profile) |
| LGPD | Consentimento de dados, direito ao esquecimento |

### 6.3 Usabilidade

| Requisito | Especificação |
|-----------|---------------|
| Responsividade | Mobile-first, funcional em todas as telas |
| Acessibilidade | WCAG 2.1 AA (parcial) |
| Idioma | Português brasileiro |
| Onboarding | Usuário produtivo em < 24h |

### 6.4 Escalabilidade

| Requisito | Especificação |
|-----------|---------------|
| Arquitetura | Serverless (Edge Functions) |
| Banco de dados | PostgreSQL com connection pooling |
| Storage | Supabase Storage com CDN |
| Crescimento | Suportar 10x crescimento sem refatoração |

### 6.5 Integrações

| Integração | Status | Descrição |
|------------|--------|-----------|
| W-API LITE | ✅ Ativo | WhatsApp Business API |
| Mercado Pago | ✅ Ativo | Pagamentos PIX e cartão |
| Supabase Storage | ✅ Ativo | Armazenamento de imagens |
| Google Calendar | 🔜 Futuro | Sincronização de agenda |

---

## 7. User Stories

### 7.1 Épico: Cadastro e Configuração Inicial

```
US-001: Como dono de barbearia, quero me cadastrar na plataforma
        para começar a usar o sistema de agendamento.
        
        Critérios de Aceite:
        - Formulário com email, senha e nome da barbearia
        - Validação de email único
        - Criação automática de shop e user_role
        - Redirecionamento para seleção de plano

US-002: Como dono de barbearia, quero selecionar um plano
        para ter acesso às funcionalidades adequadas ao meu negócio.
        
        Critérios de Aceite:
        - Exibição dos 3 planos com features
        - Trial de 7 dias para Pro e Elite
        - Ativação imediata do plano Essencial
        - Bloqueio de acesso ao dashboard sem plano selecionado

US-003: Como dono de barbearia, quero personalizar o link de agendamento
        para compartilhar com meus clientes.
        
        Critérios de Aceite:
        - Campo para editar slug (ex: minha-barbearia)
        - Validação de caracteres permitidos
        - Preview do URL completo
        - Botão de copiar link
```

### 7.2 Épico: Gestão de Serviços e Equipe

```
US-004: Como dono de barbearia, quero cadastrar meus serviços
        para que clientes possam escolher durante o agendamento.
        
        Critérios de Aceite:
        - Campos: nome, preço, duração, descrição
        - Lista de serviços ativos
        - Opção de ativar/desativar
        - Edição e exclusão

US-005: Como dono de barbearia, quero cadastrar meus barbeiros
        para que clientes possam escolher o profissional.
        
        Critérios de Aceite:
        - Campos: nome, telefone, comissão, bio
        - Upload de foto
        - Configuração de horários por dia da semana
        - Opção de bloquear horários específicos

US-006: Como dono de barbearia, quero convidar um barbeiro
        para que ele tenha acesso próprio ao sistema.
        
        Critérios de Aceite:
        - Envio de convite via WhatsApp
        - Link único com token de convite
        - Barbeiro aceita e cria conta
        - Vinculação automática ao perfil de barbeiro
```

### 7.3 Épico: Agendamento Online

```
US-007: Como cliente, quero agendar um horário online
        para não precisar ligar ou mandar mensagem.
        
        Critérios de Aceite:
        - Acesso via URL da barbearia
        - Seleção de serviço
        - Seleção de barbeiro (com rating)
        - Calendário com horários disponíveis
        - Formulário com nome e telefone
        - Confirmação na tela + WhatsApp

US-008: Como cliente, quero ver meus agendamentos
        para saber quando tenho horário marcado.
        
        Critérios de Aceite:
        - Acesso via telefone (sem login)
        - Lista de agendamentos futuros
        - Opção de cancelar
        - Detalhes do agendamento

US-009: Como cliente, quero aplicar um cupom de desconto
        para pagar menos pelo serviço.
        
        Critérios de Aceite:
        - Campo para inserir código do cupom
        - Validação em tempo real
        - Exibição do desconto aplicado
        - Preço final atualizado
```

### 7.4 Épico: Lembretes e Notificações

```
US-010: Como cliente, quero receber lembrete do meu agendamento
        para não esquecer e não faltar.
        
        Critérios de Aceite:
        - Lembrete 24h antes (se agendado com antecedência)
        - Lembrete 1h antes
        - Mensagem via WhatsApp
        - Informações do agendamento na mensagem

US-011: Como barbeiro, quero receber minha agenda diária
        para saber quantos clientes tenho no dia.
        
        Critérios de Aceite:
        - Mensagem às 7h (horário de São Paulo)
        - Lista de todos os agendamentos do dia
        - Apenas para planos Pro e Elite
        - Apenas se W-API configurado
```

### 7.5 Épico: Fidelidade

```
US-012: Como cliente, quero acumular pontos nos meus agendamentos
        para trocar por benefícios.
        
        Critérios de Aceite:
        - 10 pontos por agendamento concluído
        - Pontos creditados automaticamente
        - Visualização do saldo em /meus-agendamentos
        - Notificação quando elegível para recompensa

US-013: Como dono de barbearia, quero criar recompensas
        para incentivar a fidelidade dos clientes.
        
        Critérios de Aceite:
        - Campos: título, descrição, pontos necessários
        - Desconto em % ou valor fixo
        - Ativar/desativar recompensas
        - Analytics de resgates
```

### 7.6 Épico: Avaliações

```
US-014: Como cliente, quero avaliar o barbeiro após o atendimento
        para ajudar outros clientes na escolha.
        
        Critérios de Aceite:
        - Avaliação de 1 a 5 estrelas
        - Comentário opcional
        - Apenas para agendamentos concluídos
        - Uma avaliação por agendamento

US-015: Como cliente, quero ver as avaliações do barbeiro
        para escolher o melhor profissional.
        
        Critérios de Aceite:
        - Média de estrelas visível no booking
        - Página de perfil com todas as reviews
        - Filtro por nota
```

### 7.7 Épico: Relatórios

```
US-016: Como dono de barbearia, quero ver relatórios de faturamento
        para entender a saúde financeira do negócio.
        
        Critérios de Aceite:
        - Gráfico de evolução de receita
        - Comparativo com período anterior
        - Filtro por período customizado
        - Breakdown por status de pagamento

US-017: Como dono de barbearia, quero ver relatório de comissões
        para pagar corretamente meus barbeiros.
        
        Critérios de Aceite:
        - Comissão por barbeiro
        - Detalhamento por agendamento
        - Exportação para PDF/Excel
        - Filtro por período
```

### 7.8 Épico: Administração da Plataforma

```
US-018: Como super admin, quero ver métricas da plataforma
        para acompanhar o crescimento do negócio.
        
        Critérios de Aceite:
        - Total de barbearias ativas
        - MRR por plano
        - Taxa de conversão trial → pago
        - Churn rate

US-019: Como super admin, quero enviar lembretes de cobrança
        para reduzir inadimplência.
        
        Critérios de Aceite:
        - Lista de barbearias com pendências
        - Envio de WhatsApp individual
        - Tracking de lembretes enviados
```

---

## 8. Arquitetura do Sistema

### 8.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Landing   │  │  Dashboard  │  │   Booking   │              │
│  │    Page     │  │   (Owner)   │  │   (Client)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  React + TypeScript + Tailwind + shadcn/ui                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Auth     │  │  Database   │  │   Storage   │              │
│  │   (Users)   │  │ (PostgreSQL)│  │  (Images)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Edge Functions                      │            │
│  │  • send-whatsapp      • award-loyalty-points    │            │
│  │  • send-reminders     • expire-loyalty-points   │            │
│  │  • send-daily-agenda  • mercadopago-webhook     │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRAÇÕES EXTERNAS                        │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   W-API     │  │ Mercado Pago│                               │
│  │ (WhatsApp)  │  │ (Payments)  │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Modelo de Dados (Simplificado)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    shops     │────<│   barbers    │────<│ appointments │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   services   │     │working_hours │     │barber_reviews│
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│loyalty_points│     │blocked_times │
└──────────────┘     └──────────────┘
```

---

## 9. Modelo de Negócio

### 9.1 Planos e Preços

| Plano | Preço | Barbeiros | Trial | Features Exclusivas |
|-------|-------|-----------|-------|---------------------|
| **Essencial** | R$ 149/mês | Até 3 | Não | Funcionalidades básicas |
| **Profissional** | R$ 199/mês | Até 5 | 7 dias | Agenda diária WhatsApp, Prioridade no suporte |
| **Elite** | R$ 299/mês | Ilimitado | 7 dias | Gerente de conta dedicado, Todas features |

### 9.2 Métodos de Pagamento

- PIX (preferencial)
- Cartão de crédito (à vista, sem parcelamento)
- Processamento via Mercado Pago

### 9.3 Projeção de MRR

| Métrica | Mês 1 | Mês 3 | Mês 6 | Mês 12 |
|---------|-------|-------|-------|--------|
| Barbearias | 10 | 30 | 100 | 300 |
| MRR | R$ 1.700 | R$ 5.500 | R$ 20.000 | R$ 60.000 |

---

## 10. Roadmap

### 10.1 Fase 1 - MVP (✅ Concluído)

- [x] Autenticação e roles
- [x] Gestão de serviços e barbeiros
- [x] Agendamento online
- [x] Lembretes via WhatsApp
- [x] Dashboard básico

### 10.2 Fase 2 - Fidelidade (✅ Concluído)

- [x] Programa de pontos
- [x] Cupons e recompensas
- [x] Avaliações de barbeiros
- [x] Analytics de fidelidade

### 10.3 Fase 3 - Monetização (✅ Concluído)

- [x] Planos de assinatura
- [x] Integração Mercado Pago
- [x] Painel administrativo
- [x] Chat de suporte

### 10.4 Fase 4 - Escala (🔜 Em Planejamento)

- [ ] App mobile nativo (React Native)
- [ ] Integração Google Calendar
- [ ] SMS como fallback de WhatsApp
- [ ] Multi-idioma (Espanhol)

### 10.5 Fase 5 - Expansão (🔜 Futuro)

- [ ] Marketplace de produtos
- [ ] Controle de estoque
- [ ] Relatórios fiscais
- [ ] API pública para integrações

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Dependência do W-API | Média | Alto | Implementar fallback SMS |
| Churn alto no trial | Média | Alto | Melhorar onboarding, follow-up proativo |
| Concorrência | Alta | Médio | Foco em UX e integrações WhatsApp |
| Limitações do free tier | Baixa | Médio | Planejar migração para planos pagos |
| Escalabilidade do banco | Baixa | Alto | Monitoramento, índices otimizados |

---

## 12. Glossário

| Termo | Definição |
|-------|-----------|
| **Shop** | Barbearia cadastrada na plataforma |
| **Barber** | Profissional que atende na barbearia |
| **Owner** | Dono/administrador da barbearia |
| **Slug** | Identificador único na URL (ex: minha-barbearia) |
| **No-show** | Cliente que não comparece ao agendamento |
| **MRR** | Monthly Recurring Revenue (receita recorrente mensal) |
| **RLS** | Row Level Security (políticas de segurança no banco) |
| **W-API** | Serviço de integração com WhatsApp Business |
| **Trial** | Período de teste gratuito |
| **Churn** | Taxa de cancelamento de assinaturas |

---

## Anexos

### A. Contatos

- **Empresa:** InfoSage Tecnologia
- **WhatsApp:** (19) 99873-3540
- **Email:** contato@infobarber.com.br
- **Instagram:** @infosage_tecnologia
- **LinkedIn:** InfoSage Consultoria

### B. Links Úteis

- **Produção:** https://comb-plan.lovable.app
- **Documentação Técnica:** DOCUMENTATION.md

---

*Documento mantido pela equipe de produto da InfoSage Tecnologia.*
