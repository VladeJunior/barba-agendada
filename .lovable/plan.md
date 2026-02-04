
# Plano de Implementação: Melhorias no Dashboard

## Visão Geral
Adicionar informações de vendas de produtos ao dashboard principal, incluindo:
1. Card de vendas de produtos com comparação percentual
2. Card de faturamento atualizado com separação serviços/produtos
3. Lista dos produtos mais vendidos (similar ao "Serviços Mais Populares")
4. Card de alertas de estoque baixo

---

## 1. Atualizar Hook: `useDashboardMetrics.tsx`

### Novos Dados a Buscar
Adicionar queries para buscar dados de vendas de produtos no mesmo período:

```text
- Vendas de produtos (período atual)
- Vendas de produtos (período anterior - para comparação %)
- Produtos com estoque baixo (stock_quantity <= min_stock_alert)
- Top 5 produtos mais vendidos por quantidade
```

### Novas Métricas Retornadas
| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `productSalesRevenue` | number | Total de vendas de produtos no período |
| `productSalesGrowth` | number | Variação % em relação ao período anterior |
| `productSalesCount` | number | Quantidade de vendas realizadas |
| `topProducts` | array | Top 5 produtos mais vendidos |
| `lowStockProducts` | array | Produtos com estoque abaixo do mínimo |
| `serviceRevenue` | number | Faturamento apenas de serviços (já existe) |
| `totalRevenue` | number | Serviços + Produtos combinados |

---

## 2. Estrutura das Queries SQL

### Query: Vendas de Produtos (período atual)
```sql
SELECT 
  SUM(total_price) as total_revenue,
  COUNT(*) as sales_count,
  product_id,
  products.name,
  SUM(quantity) as total_quantity
FROM product_sales
  JOIN products ON products.id = product_sales.product_id
WHERE shop_id = ?
  AND created_at >= start_date
  AND created_at <= end_date
GROUP BY product_id, products.name
ORDER BY total_quantity DESC
LIMIT 5
```

### Query: Produtos com Estoque Baixo
```sql
SELECT id, name, stock_quantity, min_stock_alert
FROM products
WHERE shop_id = ?
  AND track_stock = true
  AND is_active = true
  AND min_stock_alert IS NOT NULL
  AND stock_quantity <= min_stock_alert
ORDER BY (stock_quantity - min_stock_alert) ASC
```

---

## 3. Atualizar Dashboard: `DashboardHome.tsx`

### Reorganização dos Cards Principais

**Linha 1: 4 Cards de Métricas**
```text
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Faturamento     │ │  Venda Produtos  │ │  Agendamentos    │ │  Ticket Médio    │
│  ─────────────   │ │  ─────────────   │ │  ─────────────   │ │                  │
│  Serviços: R$X   │ │  R$ 450,00       │ │  25              │ │  R$ 85,00        │
│  Produtos: R$Y   │ │  ▲ +15%          │ │  ▲ +8%           │ │                  │
│  Total: R$ Z     │ │                  │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Card: Faturamento (Atualizado)
- Manter ícone DollarSign verde
- Linha 1: "Serviços: R$ X"
- Linha 2: "Produtos: R$ Y"
- Linha 3 (destaque): "Total: R$ Z"
- Indicador de crescimento baseado no total combinado

### Novo Card: Vendas de Produtos
- Ícone: ShoppingBag (azul)
- Valor total de produtos vendidos no período
- Indicador de crescimento % vs período anterior
- Texto: "Vendas de Produtos"

### Nova Seção: Produtos Mais Vendidos
Similar à seção "Serviços Mais Populares" existente:
```text
┌─────────────────────────────────────────────────────────────┐
│  🛒 Produtos Mais Vendidos                                  │
│  Por quantidade vendida                                     │
├─────────────────────────────────────────────────────────────┤
│  1º  Pomada Modeladora                    15x    R$ 525,00  │
│  2º  Shampoo Anticaspa                    12x    R$ 336,00  │
│  3º  Óleo para Barba                       8x    R$ 200,00  │
│  4º  Balm Pós-Barba                        6x    R$ 150,00  │
│  5º  Cera Matte                            5x    R$ 175,00  │
└─────────────────────────────────────────────────────────────┘
```

### Nova Seção: Alertas de Estoque Baixo
Card de alerta que aparece APENAS quando há produtos com estoque baixo:
```text
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Alerta de Estoque Baixo                     [Ver Todos] │
├─────────────────────────────────────────────────────────────┤
│  🔴 Pomada Modeladora          2 un (mín: 5)                │
│  🟠 Shampoo Anticaspa          8 un (mín: 10)               │
│  🔴 Óleo para Barba            0 un (mín: 3)                │
└─────────────────────────────────────────────────────────────┘
```

- Ícone de alerta âmbar/laranja
- Lista de produtos abaixo do mínimo
- Indicador visual de severidade:
  - 🔴 Crítico: estoque = 0
  - 🟠 Baixo: estoque <= min_stock_alert
- Botão "Ver Todos" → navega para `/dashboard/products`
- Card só aparece se houver produtos com alerta

---

## 4. Layout Final do Dashboard

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                        [Hoje] [Semana] [Mês]     │
│  Segunda-feira, 3 de fevereiro de 2025                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │ Faturamento   │ │ Vendas Prod.  │ │ Agendamentos  │ │ Ticket Médio  │    │
│  │ Serv: R$X     │ │ R$ 450,00     │ │ 25            │ │ R$ 85,00      │    │
│  │ Prod: R$Y     │ │ ▲ +15%        │ │ ▲ +8%         │ │               │    │
│  │ Total: R$Z    │ │               │ │               │ │               │    │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Alerta de Estoque Baixo                              [Ver Produtos] │ │
│  │ Pomada Modeladora (2 un) · Óleo para Barba (0 un) · Shampoo (8 un)    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐         │
│  │ Barbeiros Mais Requisitados │  │ Status dos Agendamentos      │         │
│  │ [Gráfico de barras]         │  │ [Gráfico de pizza]           │         │
│  └──────────────────────────────┘  └──────────────────────────────┘         │
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐         │
│  │ Serviços Mais Populares     │  │ Produtos Mais Vendidos       │         │
│  │ 1º Corte Degradê   15x      │  │ 1º Pomada Modeladora  15x    │         │
│  │ 2º Barba Completa  12x      │  │ 2º Shampoo Anticaspa  12x    │         │
│  │ 3º Corte + Barba   10x      │  │ 3º Óleo para Barba     8x    │         │
│  └──────────────────────────────┘  └──────────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDashboardMetrics.tsx` | Adicionar queries para vendas de produtos, top products e alertas de estoque |
| `src/pages/dashboard/DashboardHome.tsx` | Adicionar novos cards e reorganizar layout |

---

## 6. Detalhes Técnicos

### Modificação em `useDashboardMetrics.tsx`

```typescript
// Novas queries a adicionar:

// 1. Vendas de produtos no período atual
const { data: currentProductSales } = await supabase
  .from("product_sales")
  .select("total_price, quantity, product:products(name)")
  .eq("shop_id", shop.id)
  .gte("created_at", start.toISOString())
  .lte("created_at", end.toISOString());

// 2. Vendas de produtos no período anterior
const { data: previousProductSales } = await supabase
  .from("product_sales")
  .select("total_price")
  .eq("shop_id", shop.id)
  .gte("created_at", previousStart.toISOString())
  .lte("created_at", previousEnd.toISOString());

// 3. Produtos com estoque baixo
const { data: lowStockProducts } = await supabase
  .from("products")
  .select("id, name, stock_quantity, min_stock_alert")
  .eq("shop_id", shop.id)
  .eq("track_stock", true)
  .eq("is_active", true)
  .not("min_stock_alert", "is", null)
  .lte("stock_quantity", supabase.raw("min_stock_alert"));
```

### Novas Propriedades no Retorno

```typescript
return {
  // Existentes
  revenue,                    // Renomear para serviceRevenue
  revenueGrowth,              // Manter (baseado no total)
  // ...outros existentes
  
  // Novos
  serviceRevenue: revenue,
  productSalesRevenue,
  productSalesGrowth,
  totalRevenue: revenue + productSalesRevenue,
  topProducts: [
    { name: "Pomada", quantity: 15, revenue: 525 },
    // ...
  ],
  lowStockProducts: [
    { id: "...", name: "Pomada", stock: 2, minStock: 5 },
    // ...
  ],
};
```

---

## 7. Resumo das Entregas

| # | Tarefa | Tipo |
|---|--------|------|
| 1 | Adicionar queries de vendas de produtos em `useDashboardMetrics` | Hook |
| 2 | Adicionar query de produtos com estoque baixo | Hook |
| 3 | Atualizar card de Faturamento com separação serviços/produtos | UI |
| 4 | Adicionar novo card de Vendas de Produtos | UI |
| 5 | Adicionar seção Produtos Mais Vendidos | UI |
| 6 | Adicionar card de Alertas de Estoque Baixo | UI |
| 7 | Reorganizar layout do dashboard | UI |
