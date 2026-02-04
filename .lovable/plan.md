
# Plano de Implementação: Sistema Híbrido de Vendas de Produtos

## Visão Geral
Implementar um sistema completo de vendas de produtos com duas modalidades:
1. **Venda durante atendimento** - Adicionar produtos a um agendamento existente, com opção de comissão para o barbeiro
2. **PDV (Ponto de Venda)** - Tela dedicada para vendas avulsas, independente de agendamentos

---

## 1. Banco de Dados

### Nova Tabela: `product_sales`
Registra todas as vendas de produtos, tanto vinculadas a agendamentos quanto avulsas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | Identificador único (PK) |
| `shop_id` | uuid | Referência à barbearia (FK) |
| `appointment_id` | uuid | Referência ao agendamento (opcional - NULL para venda avulsa) |
| `product_id` | uuid | Referência ao produto (FK) |
| `barber_id` | uuid | Barbeiro que realizou a venda (opcional) |
| `quantity` | integer | Quantidade vendida |
| `unit_price` | numeric | Preço unitário no momento da venda |
| `total_price` | numeric | Preço total (quantity * unit_price) |
| `has_commission` | boolean | Gera comissão para o barbeiro? (default: false) |
| `commission_rate` | numeric | Taxa de comissão aplicada |
| `commission_amount` | numeric | Valor da comissão calculada |
| `client_name` | text | Nome do cliente (para vendas avulsas) |
| `client_phone` | text | Telefone do cliente (para vendas avulsas) |
| `payment_method` | text | Método de pagamento (dinheiro, pix, cartão) |
| `notes` | text | Observações |
| `created_at` | timestamptz | Data da venda |

### Políticas RLS
- Donos podem gerenciar todas as vendas da sua barbearia
- Barbeiros podem visualizar vendas que realizaram
- Leitura pública desabilitada

### Trigger: Atualizar Estoque
- Ao inserir uma venda, decrementar `stock_quantity` do produto automaticamente

---

## 2. Estrutura de Arquivos

```text
src/
├── hooks/
│   └── useProductSales.tsx        # Hook CRUD para vendas
├── pages/dashboard/
│   └── Sales.tsx                  # Página PDV para vendas avulsas
├── components/
│   └── schedule/
│       └── AddProductDialog.tsx   # Modal para adicionar produtos ao agendamento
│       └── AppointmentProductsList.tsx  # Lista de produtos vinculados ao agendamento
```

---

## 3. Funcionalidade 1: Venda Durante Atendimento

### Modificações no `AppointmentDetailsDialog.tsx`

Adicionar seção de produtos vendidos dentro do dialog de detalhes do agendamento:

- Botão "+ Adicionar Produto" visível quando status é "confirmed"
- Lista de produtos já adicionados ao atendimento
- Para cada produto:
  - Nome, quantidade, preço unitário, subtotal
  - Switch "Gera Comissão?" (default: OFF)
  - Se ativado, mostra a taxa de comissão do barbeiro
  - Botão para remover produto
- Total de produtos exibido junto ao valor do serviço
- Valor total atualizado (serviço + produtos)

### Componente: `AddProductDialog.tsx`
Modal para selecionar e adicionar produto à venda:
- Select de produto (mostra nome, preço, estoque disponível)
- Input de quantidade
- Switch "Gera Comissão para o Barbeiro?"
- Preview do valor total
- Validação de estoque disponível

### Fluxo
1. Barbeiro clica em um agendamento confirmado
2. Na seção de produtos, clica em "+ Adicionar Produto"
3. Seleciona produto, quantidade e define se gera comissão
4. Produto é registrado em `product_sales` com `appointment_id` preenchido
5. Estoque é decrementado automaticamente
6. Valor aparece na lista de produtos do agendamento

---

## 4. Funcionalidade 2: PDV (Vendas Avulsas)

### Nova Página: `/dashboard/sales`

Layout em formato de PDV simplificado:

**Lado Esquerdo: Seleção de Produtos**
- Grid de produtos com imagem, nome, preço
- Campo de busca por nome/SKU
- Indicador de estoque
- Clique adiciona ao carrinho

**Lado Direito: Carrinho**
- Lista de produtos adicionados
- Quantidade editável (+/-)
- Subtotal por item
- Para cada item:
  - Checkbox "Comissão" (opcional)
  - Se marcado, select do barbeiro e taxa aplicada
- Total geral
- Campos opcionais: Cliente (nome), Telefone
- Select: Método de pagamento
- Botão "Finalizar Venda"

### Fluxo
1. Atendente seleciona produtos no grid
2. Ajusta quantidades no carrinho
3. Define se algum produto gera comissão e para qual barbeiro
4. Preenche dados do cliente (opcional)
5. Seleciona método de pagamento
6. Confirma venda
7. Sistema registra em `product_sales` com `appointment_id = NULL`
8. Estoque decrementado automaticamente

---

## 5. Navegação

### Sidebar do Dashboard
Adicionar novo item no menu (para owners):
```
{ title: "Vendas", url: "/dashboard/sales", icon: ShoppingCart }
```

Posição: Após "Produtos"

### Rotas
Adicionar em `App.tsx`:
```
<Route path="sales" element={<Sales />} />
```

---

## 6. Integração com Comissões

### Modificações no `useCommissionControl.tsx`

Atualizar query de cálculo de comissões para incluir vendas de produtos:

```sql
-- Buscar vendas de produtos com comissão no período
SELECT 
  barber_id,
  SUM(commission_amount) as product_commission
FROM product_sales
WHERE shop_id = ? 
  AND has_commission = true
  AND created_at BETWEEN ? AND ?
GROUP BY barber_id
```

O resumo de comissões passará a mostrar:
- Comissão de serviços (atual)
- Comissão de produtos (novo)
- Total combinado

---

## 7. Detalhes da Interface

### Modal Adicionar Produto (Agendamento)
```text
┌─────────────────────────────────────────┐
│  Adicionar Produto                      │
├─────────────────────────────────────────┤
│  Produto:                               │
│  [ Select produto ▼ ]                   │
│                                         │
│  Quantidade: [ 1 ] [+] [-]              │
│                                         │
│  Valor: R$ 45,00                        │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ☐ Gera comissão para o barbeiro    ││
│  │   Taxa: 30% = R$ 13,50             ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Cancelar]              [Adicionar]    │
└─────────────────────────────────────────┘
```

### Seção Produtos no Dialog de Agendamento
```text
┌─────────────────────────────────────────┐
│  Produtos Vendidos                      │
├─────────────────────────────────────────┤
│  Pomada Modeladora          2x R$ 35,00 │
│  ✓ Com comissão (30%)       = R$ 70,00  │
│                              [Remover]  │
│─────────────────────────────────────────│
│  Shampoo Barba              1x R$ 28,00 │
│  ✗ Sem comissão             = R$ 28,00  │
│                              [Remover]  │
├─────────────────────────────────────────┤
│  Total Produtos:              R$ 98,00  │
│  [+ Adicionar Produto]                  │
└─────────────────────────────────────────┘
```

---

## 8. Resumo das Entregas

| # | Tarefa | Tipo |
|---|--------|------|
| 1 | Criar tabela `product_sales` com RLS e trigger de estoque | Database |
| 2 | Criar hook `useProductSales.tsx` | Frontend |
| 3 | Criar componente `AddProductDialog.tsx` | Frontend |
| 4 | Modificar `AppointmentDetailsDialog.tsx` para incluir produtos | Frontend |
| 5 | Criar página `Sales.tsx` (PDV) | Frontend |
| 6 | Adicionar item "Vendas" no sidebar | Frontend |
| 7 | Adicionar rota `/dashboard/sales` | Frontend |
| 8 | Atualizar `useCommissionControl.tsx` para incluir comissões de produtos | Frontend |

---

## Detalhes Técnicos

### Migração SQL
```sql
-- Tabela de vendas de produtos
CREATE TABLE public.product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  barber_id uuid REFERENCES barbers(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  has_commission boolean NOT NULL DEFAULT false,
  commission_rate numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  client_name text,
  client_phone text,
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_product_sales_shop_id ON public.product_sales(shop_id);
CREATE INDEX idx_product_sales_appointment_id ON public.product_sales(appointment_id);
CREATE INDEX idx_product_sales_barber_id ON public.product_sales(barber_id);
CREATE INDEX idx_product_sales_created_at ON public.product_sales(created_at);

-- RLS
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage product sales"
  ON public.product_sales FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = product_sales.shop_id 
    AND shops.owner_id = auth.uid()
  ));

CREATE POLICY "Barbers can view their own sales"
  ON public.product_sales FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM barbers 
    WHERE barbers.id = product_sales.barber_id 
    AND barbers.user_id = auth.uid()
  ));

-- Função para decrementar estoque
CREATE OR REPLACE FUNCTION decrement_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id 
    AND track_stock = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para decrementar estoque na venda
CREATE TRIGGER on_product_sale_decrement_stock
  AFTER INSERT ON public.product_sales
  FOR EACH ROW
  EXECUTE FUNCTION decrement_product_stock();
```

---

## Próximos Passos (Futuro)
- Relatório de vendas de produtos por período
- Histórico de movimentação de estoque
- Devolução/estorno de vendas com reposição de estoque
- Integração com impressora de cupom fiscal
