
# Pop-up de Retencao com Exit Intent

## Resumo

Criar um pop-up que aparece quando o usuario move o mouse em direcao a fechar a janela, oferecendo o cupom **BARBER20** com 20% de desconto na primeira mensalidade.

## O Que Sera Feito

### 1. Criar componente ExitIntentPopup

Novo arquivo `src/components/landing/ExitIntentPopup.tsx` contendo:

**Conteudo do Pop-up:**
- Titulo: "Um presente para voce comecar hoje." (com emoji de presente)
- Subtitulo: "Vi que voce esta interessado em profissionalizar sua barbearia. Para te ajudar a dar o primeiro passo, liberei um cupom exclusivo."
- Oferta: Codigo **BARBER20** em destaque com 20% de desconto
- Botao CTA: "Resgatar Cupom e Comecar" - redireciona para /register
- Link de recusar: "Dispensar presente e fechar" - fecha o pop-up

**Logica de deteccao:**
- Evento `mouseout` no documento
- Dispara quando `event.clientY <= 0` (mouse saindo pelo topo)
- Usa `localStorage` para garantir que aparece apenas uma vez (nunca mais apos recusar ou aceitar)
- Nao aparece em dispositivos moveis (verifica largura da tela)

### 2. Integrar na pagina Index

Adicionar o componente `ExitIntentPopup` no arquivo `src/pages/Index.tsx`, logo apos o `<Footer />`.

## Design Visual

O pop-up seguira o padrao visual do InfoBarber:
- Fundo escuro com overlay
- Card centralizado com bordas arredondadas
- Icone de presente dourado
- Cupom em destaque com fundo dourado
- Botao CTA dourado (variant="gold")
- Texto de recusar discreto

## Detalhes Tecnicos

**Arquivos a criar:**
- `src/components/landing/ExitIntentPopup.tsx`

**Arquivos a modificar:**
- `src/pages/Index.tsx` (adicionar import e renderizar o componente)

**Dependencias utilizadas:**
- Componente Dialog do shadcn/ui (ja existente)
- React hooks: useState, useEffect
- lucide-react para icone (Gift)
- react-router-dom para navegacao (useNavigate)

**Persistencia:**
- `localStorage.getItem('exit-intent-shown')` para verificar se ja foi exibido
- `localStorage.setItem('exit-intent-shown', 'true')` quando fechado ou clicado
