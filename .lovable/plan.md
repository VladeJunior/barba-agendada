
# Plano de Ação: Cadastro de Produtos

## Visão Geral
Implementar uma nova funcionalidade de cadastro de produtos para a barbearia, permitindo controle opcional de estoque por produto. A estrutura seguirá o mesmo padrão já utilizado em Serviços (`Services.tsx` + `useServices.tsx`).

---

## 1. Criação da Tabela no Banco de Dados

### Tabela: `products`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | Identificador único (PK) |
| `shop_id` | uuid | Referência à barbearia (FK) |
| `name` | text | Nome do produto |
| `description` | text | Descrição do produto (opcional) |
| `price` | numeric | Preço de venda |
| `cost_price` | numeric | Preço de custo (opcional) |
| `sku` | text | Código/SKU do produto (opcional) |
| `image_url` | text | URL da imagem do produto (opcional) |
| `track_stock` | boolean | Controlar estoque? (default: false) |
| `stock_quantity` | integer | Quantidade em estoque (default: 0) |
| `min_stock_alert` | integer | Alerta de estoque mínimo (opcional) |
| `is_active` | boolean | Produto ativo? (default: true) |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Data de atualização |

### Políticas RLS
- Donos podem gerenciar produtos da sua barbearia
- Leitura pública para lojas ativas (para futuro uso em vitrine/loja)

---

## 2. Estrutura de Arquivos

```text
src/
├── hooks/
│   └── useProducts.tsx          # Hook com queries e mutations
├── pages/dashboard/
│   └── Products.tsx             # Página de listagem e cadastro
```

---

## 3. Hook: `useProducts.tsx`

Seguirá o padrão de `useServices.tsx`:
- `useProducts()` - Listar produtos da loja
- `useCreateProduct()` - Criar novo produto
- `useUpdateProduct()` - Atualizar produto
- `useDeleteProduct()` - Excluir produto

---

## 4. Página: `Products.tsx`

### Layout
- Header com título "Produtos" e botão "Novo Produto"
- Grid de cards com os produtos cadastrados
- Cada card mostra: nome, preço, status de estoque (se ativo), ações de editar/excluir

### Modal de Cadastro/Edição
Campos do formulário:
- **Nome** (obrigatório)
- **Descrição** (opcional, textarea)
- **Preço de Venda** (obrigatório, R$)
- **Preço de Custo** (opcional, R$)
- **Código/SKU** (opcional)
- **Imagem** (upload opcional)
- **Controlar Estoque** (switch toggle)
- Se ativado:
  - Quantidade em Estoque
  - Alerta de Estoque Mínimo
- **Produto Ativo** (switch toggle)

---

## 5. Navegação

### Sidebar do Dashboard
Adicionar novo item no menu:
```
{ title: "Produtos", url: "/dashboard/products", icon: Package }
```

Posição: Entre "Serviços" e "Equipe" para manter coerência.

### Rotas
Adicionar em `App.tsx`:
```
<Route path="products" element={<Products />} />
```

---

## 6. Detalhes Técnicos

### Migração SQL
```sql
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  cost_price numeric,
  sku text,
  image_url text,
  track_stock boolean NOT NULL DEFAULT false,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock_alert integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_products_shop_id ON public.products(shop_id);
CREATE INDEX idx_products_sku ON public.products(shop_id, sku) WHERE sku IS NOT NULL;

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage their products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can view products of active shops"
  ON public.products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.is_active = true
  ));
```

### Componentes UI Utilizados
- Dialog, Input, Label, Textarea, Switch, Button (já existentes)
- ImageUpload (já existe em `src/components/ui/image-upload.tsx`)
- Card com variante "elevated"
- AlertDialog para confirmação de exclusão

---

## 7. Funcionalidades Visuais

### Card do Produto
- Imagem do produto (ou placeholder)
- Nome e descrição resumida
- Preço formatado (R$ XX,XX)
- Badge indicando status: "Ativo" / "Inativo"
- Se `track_stock = true`: mostrar quantidade e alerta visual se abaixo do mínimo
- Botões de editar/excluir

### Indicadores de Estoque
- Verde: estoque normal
- Amarelo: próximo do mínimo
- Vermelho: abaixo do mínimo ou zerado

---

## Resumo das Entregas

| # | Tarefa | Tipo |
|---|--------|------|
| 1 | Criar tabela `products` com RLS | Database |
| 2 | Criar hook `useProducts.tsx` | Frontend |
| 3 | Criar página `Products.tsx` | Frontend |
| 4 | Adicionar rota `/dashboard/products` | Frontend |
| 5 | Adicionar item "Produtos" no sidebar | Frontend |

---

## Próximos Passos (Futuro)
- Integração de produtos com agendamentos (venda de produtos junto com serviços)
- Relatório de movimentação de estoque
- Histórico de vendas de produtos
