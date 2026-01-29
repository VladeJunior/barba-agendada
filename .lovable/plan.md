

# Correção do Telefone + Controle de Uso Único do Cupom

## 1. Problema do Telefone com 55

A edge function foi re-deployada agora. Por favor, teste novamente o pagamento - o código atualizado que remove o prefixo 55 já está ativo.

Se ainda não funcionar, posso adicionar logs específicos para debugar o valor do telefone.

---

## 2. Controle de Uso Único do Cupom

Para garantir que cada usuário use o cupom apenas uma vez, precisamos registrar os usos no banco de dados.

### O Que Será Feito

**1. Criar tabela `subscription_coupon_uses`**

Nova tabela para registrar cada uso de cupom:

| Coluna        | Tipo      | Descrição                           |
|---------------|-----------|-------------------------------------|
| id            | uuid      | Identificador único                 |
| shop_id       | uuid      | Barbearia que usou o cupom          |
| coupon_code   | text      | Código do cupom usado               |
| used_at       | timestamp | Data/hora do uso                    |
| billing_id    | text      | ID da cobrança na AbacatePay        |

**Índice único**: `(shop_id, coupon_code)` - impede uso duplicado

**2. Verificar uso anterior na edge function**

Antes de aplicar o cupom, verificar se a barbearia já usou:

```text
Fluxo:
1. Usuário digita cupom BARBER20
2. Edge function consulta tabela subscription_coupon_uses
3. Se já existe registro para (shop_id, BARBER20) → Cupom inválido
4. Se não existe → Aplica desconto
5. Após pagamento confirmado → Registra uso na tabela
```

**3. Registrar uso no webhook de pagamento**

No `abacatepay-webhook`, quando o pagamento for confirmado:
- Extrair `coupon_code` do metadata
- Inserir registro em `subscription_coupon_uses`

### Arquivos a Modificar

1. **Criar migração** para tabela `subscription_coupon_uses`
2. **`supabase/functions/create-abacatepay-billing/index.ts`**
   - Adicionar verificação de uso anterior
   - Retornar erro se cupom já foi usado pela barbearia
3. **`supabase/functions/abacatepay-webhook/index.ts`**
   - Registrar uso do cupom após pagamento confirmado
4. **`src/components/dashboard/PaymentDialog.tsx`**
   - Validar cupom via edge function (não apenas localmente)
   - Mostrar erro "Cupom já utilizado" quando aplicável

### Fluxo do Usuário

```text
Primeira vez usando BARBER20:
┌─────────────────────────────────────┐
│  Cupom: [BARBER20] [Aplicar]        │
│  ✓ Cupom BARBER20 aplicado!         │
│  Desconto: -R$ 29,80 (20%)          │
└─────────────────────────────────────┘

Segunda vez tentando usar BARBER20:
┌─────────────────────────────────────┐
│  Cupom: [BARBER20] [Aplicar]        │
│  ✗ Este cupom já foi utilizado      │
│    pela sua barbearia.              │
└─────────────────────────────────────┘
```

### Detalhes Técnicos

**Migração SQL:**
```sql
CREATE TABLE subscription_coupon_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id),
  coupon_code text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  billing_id text,
  UNIQUE(shop_id, coupon_code)
);

ALTER TABLE subscription_coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage coupon uses"
  ON subscription_coupon_uses FOR ALL
  USING (false) WITH CHECK (false);
```

**Verificação na edge function:**
```typescript
// Verificar se cupom já foi usado pela barbearia
const { data: existingUse } = await supabase
  .from("subscription_coupon_uses")
  .select("id")
  .eq("shop_id", shop.id)
  .eq("coupon_code", normalizedCode)
  .single();

if (existingUse) {
  return new Response(
    JSON.stringify({ error: "Este cupom já foi utilizado pela sua barbearia." }),
    { status: 400, ... }
  );
}
```

