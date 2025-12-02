# InfoBarber - Documentação Técnica Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Rotas e Páginas](#rotas-e-páginas)
5. [Componentes](#componentes)
6. [Hooks Customizados](#hooks-customizados)
7. [Edge Functions (Backend)](#edge-functions-backend)
8. [Banco de Dados](#banco-de-dados)
9. [Autenticação e Roles](#autenticação-e-roles)
10. [Fluxos de Usuário](#fluxos-de-usuário)

---

## Visão Geral

**InfoBarber** é uma plataforma SaaS de agendamento para barbearias. Permite que donos de barbearias gerenciem agendamentos, serviços, equipe e clientes, enquanto clientes podem agendar horários online.

### Tipos de Usuários

| Role | Descrição | Acesso |
|------|-----------|--------|
| `owner` | Dono da barbearia | Dashboard completo, gestão total |
| `barber` | Barbeiro funcionário | Dashboard limitado, agenda própria |
| `client` | Cliente | Agendamento público, sem login |
| `super_admin` | Administrador da plataforma | Painel administrativo |

---

## Stack Tecnológico

| Tecnologia | Uso |
|------------|-----|
| React 18 | Framework frontend |
| TypeScript | Tipagem estática |
| Vite | Build tool |
| Tailwind CSS | Estilização |
| shadcn/ui | Componentes UI |
| React Router v6 | Roteamento |
| TanStack Query | Gerenciamento de estado servidor |
| Supabase | Backend (Auth, Database, Storage, Edge Functions) |
| Recharts | Gráficos e visualizações |
| date-fns | Manipulação de datas |

---

## Estrutura de Pastas

```
src/
├── assets/                    # Imagens e assets estáticos
├── components/
│   ├── admin/                 # Componentes do painel admin
│   ├── booking/               # Componentes do fluxo de agendamento
│   ├── dashboard/             # Componentes do dashboard
│   ├── landing/               # Componentes da landing page
│   ├── loyalty/               # Componentes do programa de fidelidade
│   ├── support/               # Componentes do chat de suporte
│   └── ui/                    # Componentes base (shadcn)
├── hooks/                     # Hooks customizados
├── integrations/
│   └── supabase/              # Cliente e tipos do Supabase
├── lib/                       # Utilitários
├── pages/
│   ├── admin/                 # Páginas do painel admin
│   └── dashboard/             # Páginas do dashboard
└── App.tsx                    # Configuração de rotas

supabase/
└── functions/                 # Edge Functions (serverless)
```

---

## Rotas e Páginas

### 🌐 Rotas Públicas (Sem Autenticação)

| Rota | Arquivo | Descrição | Parâmetros |
|------|---------|-----------|------------|
| `/` | `pages/Index.tsx` | Landing page | - |
| `/login` | `pages/Login.tsx` | Tela de login | - |
| `/register` | `pages/Register.tsx` | Cadastro de nova barbearia | - |
| `/agendar/:shopSlug` | `pages/Booking.tsx` | Fluxo de agendamento do cliente | `shopSlug`: slug único da barbearia |
| `/agendar/:shopSlug/barbeiro/:barberId` | `pages/BarberProfile.tsx` | Perfil público do barbeiro | `shopSlug`, `barberId` |
| `/agendar/:shopSlug/meus-agendamentos` | `pages/MyAppointmentsByShop.tsx` | Agendamentos do cliente (por barbearia) | `shopSlug` |
| `/meus-agendamentos` | `pages/MyAppointments.tsx` | Redirecionador de agendamentos | - |
| `/aceitar-convite/:token` | `pages/AcceptInvite.tsx` | Aceitar convite de barbeiro | `token`: token do convite |
| `*` | `pages/NotFound.tsx` | Página 404 | - |

---

### 🏠 Rotas do Dashboard (Owner/Barber) - Requer Autenticação

**Base:** `/dashboard`  
**Layout:** `components/dashboard/DashboardLayout.tsx`

| Rota | Arquivo | Descrição | Roles Permitidos |
|------|---------|-----------|------------------|
| `/dashboard` | `pages/dashboard/DashboardHome.tsx` | Dashboard principal do owner | `owner` |
| `/dashboard/services` | `pages/dashboard/Services.tsx` | Gestão de serviços | `owner` |
| `/dashboard/team` | `pages/dashboard/Team.tsx` | Gestão de equipe/barbeiros | `owner` |
| `/dashboard/schedule` | `pages/dashboard/Schedule.tsx` | Calendário de agendamentos | `owner` |
| `/dashboard/clients` | `pages/dashboard/Clients.tsx` | Lista de clientes | `owner` |
| `/dashboard/reports` | `pages/dashboard/Reports.tsx` | Relatórios e analytics | `owner` |
| `/dashboard/plans` | `pages/dashboard/Plans.tsx` | Seleção/gestão de planos | `owner` |
| `/dashboard/loyalty` | `pages/dashboard/Loyalty.tsx` | Programa de fidelidade | `owner` |
| `/dashboard/support` | `pages/dashboard/Support.tsx` | Chat de suporte | `owner`, `barber` |
| `/dashboard/settings` | `pages/dashboard/Settings.tsx` | Configurações da barbearia | `owner` |
| `/dashboard/my-dashboard` | `pages/dashboard/BarberDashboardHome.tsx` | Dashboard do barbeiro | `barber` |
| `/dashboard/my-schedule` | `pages/dashboard/BarberSchedule.tsx` | Agenda do barbeiro | `barber` |
| `/dashboard/my-commission` | `pages/dashboard/BarberCommission.tsx` | Comissões do barbeiro | `barber` |

---

### 🔧 Rotas Administrativas (Super Admin)

**Base:** `/admin`  
**Layout:** `components/admin/AdminLayout.tsx`

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/admin` | `pages/admin/AdminDashboard.tsx` | Dashboard administrativo |
| `/admin/shops` | `pages/admin/AdminShops.tsx` | Lista de todas barbearias |
| `/admin/shops/:id` | `pages/admin/AdminShopDetail.tsx` | Detalhes de barbearia específica |
| `/admin/billing` | `pages/admin/AdminBilling.tsx` | Gestão de cobranças/pendências |
| `/admin/metrics` | `pages/admin/AdminMetrics.tsx` | Métricas da plataforma |
| `/admin/support` | `pages/admin/AdminSupport.tsx` | Suporte a todas barbearias |

---

## Componentes

### 📍 Landing Page (`src/components/landing/`)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `Navbar` | `Navbar.tsx` | Barra de navegação superior |
| `HeroSection` | `HeroSection.tsx` | Seção principal com CTA |
| `FeaturesSection` | `FeaturesSection.tsx` | Lista de funcionalidades |
| `PricingSection` | `PricingSection.tsx` | Tabela de preços dos planos |
| `TestimonialsSection` | `TestimonialsSection.tsx` | Depoimentos de clientes |
| `FAQSection` | `FAQSection.tsx` | Perguntas frequentes |
| `CTASection` | `CTASection.tsx` | Call-to-action final |
| `Footer` | `Footer.tsx` | Rodapé com links e contato |
| `ArcadeEmbed` | `ArcadeEmbed.tsx` | Modal com demo interativo |

---

### 📅 Fluxo de Agendamento (`src/components/booking/`)

| Componente | Arquivo | Descrição | Props Principais |
|------------|---------|-----------|------------------|
| `ShopCoverHeader` | `ShopCoverHeader.tsx` | Header com capa/logo da barbearia | `coverUrl`, `logoUrl`, `shopName`, `title`, `subtitle` |
| `BookingStepper` | `BookingStepper.tsx` | Indicador de passos do agendamento | `steps[]`, `currentStep` |
| `ServiceSelector` | `ServiceSelector.tsx` | Seleção de serviço | `services[]`, `selectedServiceId`, `onSelect()` |
| `BarberSelector` | `BarberSelector.tsx` | Seleção de barbeiro | `barbers[]`, `selectedBarberId`, `onSelect()`, `shopSlug` |
| `DateTimePicker` | `DateTimePicker.tsx` | Seleção de data/hora | `barberId`, `serviceDuration`, `shopId`, `onSelect()` |
| `BookingConfirmation` | `BookingConfirmation.tsx` | Confirmação e dados do cliente | `service`, `barber`, `dateTime`, `shopId`, `onConfirm()` |
| `ReviewDialog` | `ReviewDialog.tsx` | Modal para avaliar barbeiro | `appointmentId`, `barberId`, `onSuccess()` |

---

### 🏢 Dashboard (`src/components/dashboard/`)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `DashboardLayout` | `DashboardLayout.tsx` | Layout principal com sidebar |
| `DashboardSidebar` | `DashboardSidebar.tsx` | Menu lateral com navegação |
| `WorkingHoursDialog` | `WorkingHoursDialog.tsx` | Modal para configurar horários |
| `BlockedTimesDialog` | `BlockedTimesDialog.tsx` | Modal para bloquear horários |
| `LinkBarberDialog` | `LinkBarberDialog.tsx` | Modal para vincular barbeiro |
| `PortfolioDialog` | `PortfolioDialog.tsx` | Modal para gerenciar portfólio |
| `PaymentDialog` | `PaymentDialog.tsx` | Modal de pagamento |

---

### 🔐 Admin (`src/components/admin/`)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `AdminLayout` | `AdminLayout.tsx` | Layout do painel admin |
| `AdminSidebar` | `AdminSidebar.tsx` | Menu lateral admin |

---

### 💬 Suporte (`src/components/support/`)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `ChatWindow` | `ChatWindow.tsx` | Janela principal do chat |
| `ChatMessage` | `ChatMessage.tsx` | Componente de mensagem |
| `ChatInput` | `ChatInput.tsx` | Input de nova mensagem |
| `ConversationList` | `ConversationList.tsx` | Lista de conversas |

---

### 🎁 Fidelidade (`src/components/loyalty/`)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `LoyaltyCard` | `LoyaltyCard.tsx` | Card de pontos do cliente |

---

## Hooks Customizados

### Autenticação e Usuário

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useAuth` | `useAuth.tsx` | Contexto de autenticação | `user`, `session`, `signIn()`, `signUp()`, `signOut()` |
| `useUserRole` | `useUserRole.tsx` | Role do usuário atual | `role`, `shopId`, `barberId`, `isLoading` |
| `useAdminAuth` | `useAdminAuth.tsx` | Verificação de super_admin | `isAdmin`, `loading` |

### Dados da Barbearia

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useShop` | `useShop.tsx` | Dados da barbearia do usuário | `shop` object |
| `usePublicShop` | `usePublicShop.tsx` | Dados públicos de barbearia | `usePublicShopBySlug(slug)` |
| `useServices` | `useServices.tsx` | Serviços da barbearia | `services[]`, `createService()`, `updateService()`, `deleteService()` |
| `useBarbers` | `useBarbers.tsx` | Barbeiros da barbearia | `barbers[]`, `createBarber()`, `updateBarber()`, `deleteBarber()` |
| `useWorkingHours` | `useWorkingHours.tsx` | Horários de trabalho | `workingHours[]`, `updateWorkingHours()` |
| `useBlockedTimes` | `useBlockedTimes.tsx` | Horários bloqueados | `blockedTimes[]`, `createBlockedTime()`, `deleteBlockedTime()` |

### Agendamentos

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useAppointments` | `useAppointments.tsx` | Agendamentos | `appointments[]`, `updateStatus()` |

### Métricas e Relatórios

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useDashboardMetrics` | `useDashboardMetrics.tsx` | Métricas do dashboard | `todayAppointments`, `weekRevenue`, etc. |
| `useRevenueChart` | `useRevenueChart.tsx` | Dados para gráfico de receita | `chartData[]` |
| `useOperationalMetrics` | `useOperationalMetrics.tsx` | Métricas operacionais | `peakHours`, `cancellationRate`, etc. |
| `useBarberStats` | `useBarberStats.tsx` | Estatísticas do barbeiro | `totalAppointments`, `completionRate`, `revenue` |

### Fidelidade

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useLoyalty` | `useLoyalty.tsx` | Programa de fidelidade | `rewards[]`, `coupons[]`, `createReward()`, etc. |
| `useLoyaltyAnalytics` | `useLoyaltyAnalytics.tsx` | Analytics de fidelidade | `redemptionStats`, `topClients[]` |

### Assinatura

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useSubscription` | `useSubscription.tsx` | Status da assinatura | `plan`, `status`, `needsPlanSelection` |

### Suporte

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useSupportConversations` | `useSupportConversations.tsx` | Conversas de suporte | `conversations[]`, `createConversation()` |
| `useSupportMessages` | `useSupportMessages.tsx` | Mensagens do chat | `messages[]`, `sendMessage()` |
| `useUnreadCount` | `useUnreadCount.tsx` | Contagem de não lidas | `unreadCount` |

### Avaliações

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useBarberReviews` | `useBarberReviews.tsx` | Avaliações do barbeiro | `reviews[]`, `averageRating` |
| `useBarberPortfolio` | `useBarberPortfolio.tsx` | Portfólio do barbeiro | `portfolioImages[]` |

### Notificações

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `useNotificationSound` | `useNotificationSound.tsx` | Som de notificação | `playSound()` |
| `useBrowserNotification` | `useBrowserNotification.tsx` | Notificações do browser | `showNotification()`, `requestPermission()` |
| `useNotificationPreferences` | `useNotificationPreferences.tsx` | Preferências de notificação | `soundEnabled`, `browserEnabled`, `toggle()` |

### Utilitários

| Hook | Arquivo | Descrição | Retorno Principal |
|------|---------|-----------|-------------------|
| `use-mobile` | `use-mobile.tsx` | Detecção de mobile | `isMobile` |
| `use-toast` | `use-toast.ts` | Sistema de toasts | `toast()` |

---

## Edge Functions (Backend)

### Localização: `supabase/functions/`

| Função | Descrição | Trigger |
|--------|-----------|---------|
| `send-whatsapp` | Envia mensagens WhatsApp via W-API | HTTP POST |
| `send-appointment-reminders` | Envia lembretes de agendamento | Cron (*/5 * * * *) |
| `send-daily-agenda` | Envia agenda diária para barbeiros | Cron (7h São Paulo) |
| `send-barber-invite` | Envia convite para barbeiro via WhatsApp | HTTP POST |
| `send-billing-reminder` | Envia lembrete de cobrança | HTTP POST |
| `award-loyalty-points` | Concede pontos de fidelidade | HTTP POST |
| `expire-loyalty-points` | Expira pontos vencidos | Cron (diário) |
| `create-mercadopago-preference` | Cria preferência de pagamento | HTTP POST |
| `process-payment` | Processa pagamento | HTTP POST |
| `check-payment-status` | Verifica status de pagamento | HTTP POST |
| `mercadopago-webhook` | Webhook do Mercado Pago | HTTP POST |
| `request-wapi-credentials` | Solicita credenciais W-API | HTTP POST |

---

## Banco de Dados

### Tabelas Principais

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `shops` | Barbearias | `id`, `name`, `slug`, `owner_id`, `plan`, `subscription_status` |
| `barbers` | Barbeiros | `id`, `name`, `shop_id`, `user_id`, `commission_rate`, `is_active` |
| `services` | Serviços | `id`, `name`, `price`, `duration_minutes`, `shop_id`, `is_active` |
| `appointments` | Agendamentos | `id`, `shop_id`, `barber_id`, `service_id`, `start_time`, `end_time`, `status`, `client_name`, `client_phone` |
| `working_hours` | Horários de trabalho | `id`, `barber_id`, `day_of_week`, `start_time`, `end_time`, `is_active` |
| `blocked_times` | Horários bloqueados | `id`, `barber_id`, `start_time`, `end_time`, `reason` |
| `barber_reviews` | Avaliações | `id`, `barber_id`, `appointment_id`, `rating`, `comment` |
| `barber_portfolio` | Portfólio | `id`, `barber_id`, `image_url`, `description` |
| `barber_invitations` | Convites | `id`, `barber_id`, `email`, `token`, `status` |
| `loyalty_points` | Pontos de fidelidade | `id`, `shop_id`, `client_phone`, `total_points`, `lifetime_points` |
| `loyalty_rewards` | Recompensas | `id`, `shop_id`, `title`, `points_required`, `discount_percentage` |
| `loyalty_coupons` | Cupons | `id`, `shop_id`, `code`, `discount_percentage`, `discount_amount` |
| `loyalty_transactions` | Transações de pontos | `id`, `shop_id`, `client_phone`, `points_change`, `description` |
| `support_conversations` | Conversas de suporte | `id`, `shop_id`, `subject`, `status` |
| `support_messages` | Mensagens de suporte | `id`, `conversation_id`, `sender_id`, `content`, `is_read` |
| `user_roles` | Roles de usuário | `id`, `user_id`, `role`, `shop_id` |
| `profiles` | Perfis de usuário | `id`, `user_id`, `full_name`, `phone` |
| `appointment_reminders` | Lembretes enviados | `id`, `appointment_id`, `reminder_type`, `status` |

### Enums

| Enum | Valores |
|------|---------|
| `app_role` | `owner`, `barber`, `client`, `super_admin` |
| `appointment_status` | `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `payment_status` | `pending`, `paid`, `refunded` |
| `subscription_plan` | `essencial`, `profissional`, `elite` |
| `subscription_status` | `trial`, `active`, `past_due`, `cancelled`, `expired` |
| `conversation_status` | `open`, `pending`, `closed` |

---

## Autenticação e Roles

### Fluxo de Autenticação

```
1. Usuário acessa /login ou /register
2. Supabase Auth gerencia sessão
3. useAuth() provê contexto global
4. useUserRole() identifica role do usuário
5. DashboardLayout/AdminLayout verificam permissões
6. RLS policies protegem dados no banco
```

### Verificação de Permissões

| Role | Verificação |
|------|-------------|
| `owner` | `shops.owner_id = auth.uid()` |
| `barber` | `barbers.user_id = auth.uid() AND barbers.is_active = true` |
| `super_admin` | `has_role(auth.uid(), 'super_admin')` |

---

## Fluxos de Usuário

### 1. Registro de Nova Barbearia

```
/register → Preencher dados → Criar shop + user_role
         → /dashboard/plans → Selecionar plano
         → /dashboard (Dashboard principal)
```

### 2. Agendamento de Cliente

```
/agendar/:shopSlug → Selecionar serviço
                   → Selecionar barbeiro
                   → Selecionar data/hora
                   → Preencher dados pessoais
                   → Confirmar (opcional: aplicar cupom)
                   → WhatsApp de confirmação
```

### 3. Convite de Barbeiro

```
Owner: /dashboard/team → Adicionar barbeiro → Enviar convite WhatsApp
Barbeiro: Clica no link → /aceitar-convite/:token → Login/Register → Vinculação automática
```

### 4. Fluxo de Fidelidade

```
Cliente agenda → Agendamento concluído → award-loyalty-points
              → Pontos acumulados → Notificação WhatsApp (se elegível)
              → Cliente usa pontos em nova reserva
```

### 5. Suporte

```
Owner: /dashboard/support → Nova conversa → Enviar mensagem
Admin: /admin/support → Ver todas conversas → Responder
(Realtime atualiza ambos os lados)
```

---

## Variáveis de Ambiente (Secrets)

| Nome | Descrição |
|------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso do Mercado Pago |
| `APP_URL` | URL da aplicação em produção |

---

## Notas para Testes

### Endpoints Públicos (sem auth)
- GET `/` - Landing page
- GET `/agendar/:shopSlug` - Agendamento
- POST appointment (via Supabase client)

### Endpoints Autenticados
- Todas as rotas `/dashboard/*` requerem auth
- Todas as rotas `/admin/*` requerem `super_admin`

### Dados de Teste Recomendados
1. Criar shop de teste com slug conhecido
2. Criar serviços e barbeiros
3. Configurar working_hours para barbeiros
4. Testar fluxo completo de agendamento

### IDs Importantes
- Super Admin User ID: `05f40864-6d63-49fa-b8cc-68a94cb5fb6a`
- Super Admin Email: `contato@infobarber.com.br`

### Timezone
- Toda a aplicação usa `America/Sao_Paulo`
