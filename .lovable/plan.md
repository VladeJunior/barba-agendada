
# Plano de Correção: Mensagem de Campanha de Retorno

## Problema Identificado
A mensagem de campanha de retorno está sendo enviada incorretamente porque existe uma **inconsistência entre o nome do parâmetro** enviado pelo frontend e o esperado pelo backend:

| Componente | Parâmetro Enviado | Parâmetro Esperado |
|------------|-------------------|-------------------|
| `ReturnCampaignDialog.tsx` | `customMessage` | - |
| `send-whatsapp/index.ts` | - | `message` |

### O que acontece:
1. Frontend envia: `{ shopId, phone, customMessage: "Fala João!..." }`
2. Backend faz: `const { message: customMessage } = data` → `customMessage = undefined`
3. Condição `if (customMessage)` falha
4. Backend usa o template de confirmação de agendamento (que precisa de `clientName`, `dateTime`, etc - todos `undefined`)

---

## Solução
Alterar o frontend para enviar `message` ao invés de `customMessage`, mantendo consistência com a interface `WhatsAppRequest` do edge function.

### Arquivo a Modificar

**`src/components/dashboard/ReturnCampaignDialog.tsx`**

Linha 79-85 - Alterar de:
```typescript
const { error } = await supabase.functions.invoke("send-whatsapp", {
  body: {
    shopId,
    phone: client.client_phone,
    customMessage: personalizedMessage,  // ❌ Errado
  },
});
```

Para:
```typescript
const { error } = await supabase.functions.invoke("send-whatsapp", {
  body: {
    shopId,
    phone: client.client_phone,
    message: personalizedMessage,  // ✅ Correto
  },
});
```

---

## Resultado Esperado
Após a correção, a mensagem enviada será a mensagem personalizada da campanha de retorno:

```
Fala [Nome]! 💈 Passando pra lembrar que estamos aqui na [Barbearia] sempre prontos pra deixar seu visual impecável! Manda um oi para agendar. 👊
```

Ao invés do template de confirmação de agendamento.

---

## Resumo

| # | Tarefa | Tipo |
|---|--------|------|
| 1 | Alterar parâmetro `customMessage` para `message` em `ReturnCampaignDialog.tsx` | Correção de Bug |
