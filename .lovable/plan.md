

# Sistema de Cupom de Desconto para Planos

## Analise do Sistema Atual

Apos analisar o codigo, identifiquei que:

1. O **ExitIntentPopup** oferece o cupom `BARBER20` com 20% de desconto
2. O **PaymentDialog** e a **edge function create-abacatepay-billing** processam pagamentos
3. A **AbacatePay tem suporte nativo a cupons** via API (create/apply)

## Opcoes de Implementacao

Existem duas abordagens para aplicar o cupom:

### Opcao 1: Cupom Aplicado no Frontend (Recomendada)

O desconto e calculado no frontend antes de enviar para a AbacatePay. Mais simples e nao depende de recursos extras da API.

**Fluxo:**
```text
Usuario digita cupom → Valida localmente → Calcula preco com desconto → Envia preco final para AbacatePay
```

**Vantagens:**
- Implementacao simples e rapida
- Nao depende de criar cupons na AbacatePay
- Controle total sobre os cupons validos

**Desvantagens:**
- Cupons ficam "hardcoded" no codigo

### Opcao 2: Cupom via API AbacatePay

Criar o cupom na AbacatePay e aplicar via API no momento da cobranca.

**Vantagens:**
- Cupons gerenciados externamente
- Rastreamento de uso pela AbacatePay

**Desvantagens:**
- Requer criar cupom manualmente no painel AbacatePay
- Mais complexo de implementar

---

## Plano de Implementacao (Opcao 1 - Recomendada)

### O Que Sera Feito

**1. Adicionar campo de cupom no PaymentDialog**

Modificar `src/components/dashboard/PaymentDialog.tsx`:
- Adicionar input para digitar codigo do cupom
- Botao "Aplicar" para validar o cupom
- Exibir desconto aplicado e preco final
- Mostrar mensagem de erro se cupom invalido

**2. Passar cupom para a edge function**

Modificar a chamada para `create-abacatepay-billing`:
- Enviar codigo do cupom junto com o planId
- A edge function calcula o preco com desconto

**3. Atualizar edge function para aplicar desconto**

Modificar `supabase/functions/create-abacatepay-billing/index.ts`:
- Receber codigo do cupom
- Validar cupom (codigo, validade, limite de uso)
- Calcular preco com desconto
- Enviar preco final para AbacatePay

**4. Criar tabela para cupons de assinatura (opcional)**

Se quiser gerenciar cupons dinamicamente, criar tabela `subscription_coupons` com:
- codigo
- desconto (porcentagem)
- data de expiracao
- limite de uso
- contador de uso

### Fluxo do Usuario

```text
+------------------------------------------+
|          Dialog de Pagamento             |
|------------------------------------------|
|  Plano: Profissional                     |
|  Valor: R$ 149,00/mes                    |
|                                          |
|  [___Codigo do cupom___] [Aplicar]       |
|                                          |
|  ✓ Cupom BARBER20 aplicado!              |
|    Desconto: -R$ 29,80 (20%)             |
|    Valor final: R$ 119,20                |
|                                          |
|  [        Pagar agora via PIX       ]    |
+------------------------------------------+
```

### Cupons Validos (Inicialmente)

| Codigo    | Desconto | Descricao                        |
|-----------|----------|----------------------------------|
| BARBER20  | 20%      | Cupom do pop-up de exit intent   |

---

## Detalhes Tecnicos

### Arquivos a Modificar

1. **`src/components/dashboard/PaymentDialog.tsx`**
   - Adicionar estado para cupom (`couponCode`, `appliedCoupon`, `discountAmount`)
   - Funcao `handleApplyCoupon()` para validar e calcular desconto
   - Exibir UI do cupom e desconto aplicado
   - Passar cupom para a edge function

2. **`supabase/functions/create-abacatepay-billing/index.ts`**
   - Receber `couponCode` no body da requisicao
   - Validar cupom contra lista de cupons validos
   - Calcular preco com desconto
   - Registrar uso do cupom (opcional)

### Interface do PaymentDialog Atualizada

```text
Props atuais:
- planId
- planName  
- planPrice

Novos estados internos:
- couponCode: string
- appliedCoupon: { code: string, discountPercent: number } | null
- discountAmount: number
- finalPrice: number
- couponError: string | null
- isValidatingCoupon: boolean
```

### Validacao de Cupons

Cupons validos serao definidos como constante (inicialmente):

```text
VALID_COUPONS = {
  BARBER20: { discountPercent: 20, description: "20% de desconto" }
}
```

Pode ser migrado para tabela no banco futuramente.

---

## Consideracoes Adicionais

1. **Cupom so vale para primeira mensalidade**: O desconto e aplicado apenas no primeiro pagamento, nao em renovacoes

2. **Validacao case-insensitive**: Aceitar `barber20`, `BARBER20`, `Barber20`

3. **Feedback visual claro**: Mostrar checkmark verde quando cupom valido, erro em vermelho quando invalido

4. **Pre-preencher cupom**: Se usuario veio do pop-up de exit intent, podemos pre-preencher o cupom automaticamente (futuro)

