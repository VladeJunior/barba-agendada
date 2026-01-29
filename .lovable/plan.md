

# Correção do Formato do Telefone para AbacatePay

## Problema Identificado

Após análise da documentação da AbacatePay e do banco de dados:

**Formato atual enviado:** `19998733540` (apenas dígitos)
**Formato esperado pela AbacatePay:** `(19) 99873-3540` (formatado com parênteses e hífen)

A documentação da AbacatePay mostra claramente no exemplo:
```json
{
  "cellphone": "(11) 4002-8922"
}
```

A AbacatePay exibe o telefone com `+55` na frente automaticamente, mas espera receber o número no formato brasileiro com DDD entre parênteses.

## Solução

Modificar a função `normalizeCellphone` na edge function `create-abacatepay-billing` para:

1. Extrair apenas os dígitos
2. Remover o prefixo `55` se presente
3. **Formatar como `(DDD) XXXXX-XXXX` ou `(DDD) XXXX-XXXX`** dependendo se é celular (9 dígitos) ou fixo (8 dígitos)

## Arquivo a Modificar

**`supabase/functions/create-abacatepay-billing/index.ts`**

## Nova Lógica da Função

```text
Entrada: "+5519998733540" ou "5519998733540" ou "(19) 99873-3540"
         ↓
Extrair dígitos: "5519998733540"
         ↓
Remover 55 se presente: "19998733540"
         ↓
Validar comprimento: 10-11 dígitos ✓
         ↓
Formatar: "(19) 99873-3540"
         ↓
Saída: "(19) 99873-3540"
```

## Código Atualizado

```typescript
const normalizeCellphone = (value: string | null | undefined) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  // Remove country code if present, keep only DDD + number
  const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;

  // BR: DDD(2) + phone(8-9) => 10-11 digits
  if (withoutCountry.length < 10 || withoutCountry.length > 11) return null;

  // Format as (DDD) XXXXX-XXXX or (DDD) XXXX-XXXX
  const ddd = withoutCountry.slice(0, 2);
  const rest = withoutCountry.slice(2);
  
  if (rest.length === 9) {
    // Celular: (XX) XXXXX-XXXX
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  } else {
    // Fixo: (XX) XXXX-XXXX
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
};
```

## Resultado Esperado

| Entrada no banco           | Saída formatada        |
|----------------------------|------------------------|
| `(19) 99873-3540`          | `(19) 99873-3540`      |
| `+5519998733540`           | `(19) 99873-3540`      |
| `5519998733540`            | `(19) 99873-3540`      |
| `19998733540`              | `(19) 99873-3540`      |

