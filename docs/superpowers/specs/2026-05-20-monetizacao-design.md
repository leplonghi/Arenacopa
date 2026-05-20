# Design: Monetização ArenaCopa

**Data:** 2026-05-20  
**Status:** Aprovado  
**Escopo:** Estrutura completa de planos, preços, regras e fluxos de pagamento — B2C e B2B

---

## 1. Contexto e objetivos

ArenaCopa tem duas janelas temporais de receita:

- **Copa 2026** (jun–jul/2026): evento pontual de alta demanda, oportunidade de aquisição massiva
- **Campeonatos contínuos** (pós-Copa): Brasileirão, Libertadores, etc. — base de receita recorrente

O modelo anterior apresentava três problemas de arbitragem que invalidavam a lógica de compra:

1. Arena PRO mensal (R$9,90) mais barato que Copa Pass (R$29,90) → usuário assina PRO e cancela
2. Parceiro Anual (R$199,90) mais barato e com mais features que Copa Completa (R$249,90)
3. Pacote 5 Jogos (R$149,90) vs Copa Completa (R$249,90): apenas R$100 por 27 jogos a mais

Este design resolve todos os três arbitragens e separa claramente B2C de B2B.

---

## 2. Estrutura B2C — Usuário / Torcedor

### 2.1 Planos

| Plano | Preço | Recorrência |
|-------|-------|-------------|
| Free | R$ 0 | — |
| Copa Pass 2026 | R$ 19,90 | Pagamento único |
| Arena PRO Mensal | R$ 24,90 | Mensal recorrente |
| Arena PRO Anual | R$ 99,90 | Anual recorrente |

### 2.2 Limites e features por plano

| Feature | Free | Copa Pass | PRO Mensal | PRO Anual |
|---------|------|-----------|------------|-----------|
| Bolões ativos | 2 | 5 | Ilimitado | Ilimitado |
| Membros por bolão | 20 | 100 | Ilimitado | Ilimitado |
| Simulador | — | Básico (Copa) | Completo | Completo |
| Notificações ao vivo | — | Copa | Copa + Campeonatos | Copa + Campeonatos |
| Caixinha & PIX | — | ✓ | ✓ | ✓ |
| Analytics avançado | — | — | ✓ | ✓ |
| Grupos ilimitados | — | — | ✓ | ✓ |
| Campeonatos pós-Copa | — | — | ✓ | ✓ |
| Badge PRO exclusivo | — | — | — | ✓ |
| Acesso antecipado | — | — | — | ✓ |
| Validade | Permanente | Até 19/jul/2026 | Até cancelar | 12 meses |

### 2.3 Lógica de preços (sem arbitragem)

```
Copa Pass (R$19,90) < PRO Mensal (R$24,90) < PRO Anual (R$8,33/mês)
```

- **Copa Pass** é o produto "sem compromisso" — mais barato que um mês de PRO, mas com limites reais e sem Campeonatos. Público: avesso a assinatura, só quer a Copa.
- **PRO Mensal** custa mais que Copa Pass porque entrega mais (ilimitado + Campeonatos) e tem flexibilidade de cancelamento. Padrão Netflix/Spotify.
- **PRO Anual** é o melhor custo-benefício (67% de desconto vs mensal). Público: fã do esporte o ano todo.

### 2.4 Stripe Price IDs

| Plano | Stripe Price ID |
|-------|----------------|
| Copa Pass 2026 | `price_copa_pass_2026` |
| PRO Mensal | `price_pro_monthly` |
| PRO Anual | `price_pro_annual` |

Todos os IDs devem ser configurados como Firebase Secrets (não hardcoded).

---

## 3. Estrutura B2B — Bar / Restaurante / Negócio

B2B é dividido em **dois produtos independentes** com propósitos distintos:

### 3.1 Produto 1 — Campanhas por Alcance (publicidade avulsa)

Slots de exposição da marca nos bolões dos torcedores. Pagamento único, sem recorrência.

| Pacote | Preço | Alcance estimado | Jogos |
|--------|-------|-----------------|-------|
| Por Jogo | R$ 59,90 | ~200 participantes | 1 jogo |
| Fase de Grupos | R$ 199,90 | ~600 participantes | 8 jogos |
| Copa Completa | R$ 449,90 | ~1.500 participantes | 32 jogos |

CPM estimado: R$3,00–R$4,00 vs Meta Ads R$20–R$80 sem contexto esportivo.

### 3.2 Produto 2 — Parceiro ArenaCopa (presença anual)

SaaS recorrente anual. Presença de marca contínua + dashboard + campanhas inclusas.

| Tier | Preço | Inclui |
|------|-------|--------|
| Parceiro Local | R$ 299,90/ano | Dashboard, analytics mensal, marca em bolões da cidade, 1 campanha/mês, 30% off avulsas, Arena PRO pessoal, NF-e automática |
| Parceiro Nacional | R$ 699,90/ano | Tudo do Local + analytics semanal, marca nacional, 1 Fase de Grupos + 2x Por Jogo, destaque no Guia de Cidades |

### 3.3 Separação de propósito (sem arbitragem)

- **Campanhas** = publicidade temporária, slots de impressão, ROI mensurável por jogo
- **Parceiro** = presença de marca contínua, relacionamento, ferramentas de gestão

Não competem entre si. Parceiro Anual com 30% off em campanhas avulsas incentiva o uso de ambos.

---

## 4. Regras do modelo

**R1 — PRO inclui Copa Pass.** Assinantes PRO (mensal ou anual) têm automaticamente todos os benefícios da Copa Pass. Não precisam pagar Copa Pass separado.

**R2 — Crédito de upgrade Copa Pass → PRO.** Se o usuário comprou Copa Pass e decide assinar PRO Mensal, R$19,90 é creditado no primeiro mês (paga apenas R$5,00). Implementar via Stripe coupon ou invoice adjustment.

**R3 — Copa Pass não renova.** Expira automaticamente em 19/jul/2026 (encerramento da Copa 2026). O app envia notificação de oferta PRO 7 dias antes e no dia da expiração.

**R4 — Free pós-Copa Pass.** Usuário Copa Pass retorna ao Free após expiração. Bolões criados são mantidos em modo visualização (não pode criar novos até reativar ou assinar PRO).

**R5 — Parceiro inclui PRO pessoal.** A conta do negócio recebe Arena PRO pessoal para a conta owner. Benefício: o dono do bar usa o app como usuário premium.

**R6 — Parceiro ≠ Campanha.** Parceiro Anual não é um substituto de campanhas. São produtos com propósitos diferentes. A compra de um não invalida o outro.

**R7 — Desconto Parceiro em campanhas.** Parceiros têm 30% de desconto em campanhas avulsas adicionais além das inclusas no plano.

**R8 — Pagamentos B2C.** PIX (liquidação imediata) + Cartão via Stripe. PRO Anual aceita parcelamento em 2x sem juros. Copa Pass sempre à vista.

**R9 — Pagamentos B2B.** PIX + Cartão + Boleto (B2B preferencial). Parcelamento em até 3x para Copa Completa e Parceiro Nacional. NF-e gerada automaticamente.

**R10 — Copa Pass é 2026 only.** Copa Pass é um produto temporal. Não existe "Copa Pass 2030" como produto permanente — na próxima Copa o produto será recriado com novos Price IDs.

---

## 5. Fluxos de pagamento

### 5.1 Fluxo B2C (Stripe)

```
1. Usuário clica em "Assinar" no paywall
2. Firebase Function createStripeCheckout é chamada
   - Valida usuário autenticado
   - Recebe priceId do plano escolhido
   - Cria Stripe Checkout Session com:
     - customer_email: user.email
     - metadata: { userId, plan }
     - success_url: /premium/sucesso
     - cancel_url: /premium
3. Usuário completa pagamento no Stripe Checkout
4. Stripe dispara webhook checkout.session.completed
5. Firebase Function stripeWebhook processa:
   - Verifica assinatura (stripe.webhooks.constructEvent)
   - Atualiza Firestore: users/{uid}.subscription = { plan, status, expiresAt }
   - Gera Copa Pass credit se aplicável (R2)
6. App detecta mudança via onSnapshot e libera features
```

**Correção crítica necessária:** `req.rawBody` não está disponível em Firebase Functions v2. Usar `express.raw({ type: 'application/json' })` como middleware antes do handler do webhook.

### 5.2 Fluxo B2B (manual → automatizar)

```
1. Negócio acessa /parceiro ou /campanha no app/web
2. Seleciona pacote e preenche dados da empresa (CNPJ, razão social)
3. Escolhe pagamento: PIX / Cartão / Boleto
4. Firebase Function createB2BCheckout:
   - Cria Stripe Checkout ou gera QR PIX via Stripe
   - Para boleto: cria Payment Intent com boleto payment method
5. Confirmação dispara webhook
6. Firebase Function processB2BPayment:
   - Cria documento em businesses/{businessId}
   - Cria documento em campaigns/{campaignId} com status: 'active'
   - Gera NF-e via integração (Nota Fiscal API ou similar)
7. Negócio recebe email de confirmação com credenciais de acesso ao dashboard
```

---

## 6. Estrutura Firestore

### 6.1 Coleções novas/modificadas

```
users/{uid}
  subscription: {
    plan: 'free' | 'copa_pass' | 'pro_monthly' | 'pro_annual'
    status: 'active' | 'canceled' | 'expired'
    stripeCustomerId: string
    stripeSubscriptionId: string | null  // null para Copa Pass (one-time)
    currentPeriodEnd: Timestamp
    copaPassCreditApplied: boolean       // R2 — crédito de upgrade
  }

businesses/{businessId}
  name: string
  cnpj: string
  tier: 'local' | 'national'
  status: 'active' | 'inactive'
  stripeCustomerId: string
  partnersince: Timestamp
  expiresAt: Timestamp
  ownerId: string  // uid do usuário PRO incluso (R5)

campaigns/{campaignId}
  businessId: string
  package: 'per_game' | 'group_stage' | 'full_copa'
  status: 'pending' | 'active' | 'completed'
  reach: number
  startDate: Timestamp
  endDate: Timestamp
  games: string[]  // match IDs cobertos
  stripePaymentIntentId: string
```

---

## 7. Projeções de receita

| Cenário | Copa + 6 meses pós | Premissas |
|---------|-------------------|-----------|
| Conservador | R$ 18.000 | 200 Copa Pass, 50 PRO/mês, 10 campanhas |
| **Realista** | **R$ 62.000** | **800 Copa Pass, 200 PRO/mês, 30 campanhas** |
| Otimista | R$ 220.000 | 3.000 Copa Pass, 600 PRO/mês, 50 campanhas |

Cenário realista assume: crescimento orgânico via compartilhamento de bolões (k-factor ~1,3) + 2 campanhas pagas no Instagram/TikTok durante a Copa. Descontar ~3% Stripe fees e ~R$800/mês Firebase em escala realista.

---

## 8. Dependências de implementação

### Críticas (bloqueiam pagamentos)

1. **Stripe webhook rawBody** — `req.rawBody` não populado em Functions v2. Usar `express.raw()`.
2. **STRIPE_PREMIUM_PRICE_ID** — não está na lista de secrets em `createStripeCheckout`. Adicionar todos os Price IDs como secrets.
3. **canCreateBolao hardcoded true** — limites de plano nunca são aplicados. Corrigir `usePlanLimits`.

### Importantes (corrigir antes do launch)

4. **Firestore rules TEMPORARY** — `matches` e `copa_news` com `allow write: if isSignedIn()`. Reverter.
5. **Open redirect** em `createStripeCheckout` — validar `origin` contra allowlist.
6. **Stripe Price IDs em brand-constants.ts** — substituir placeholders pelos IDs reais do Stripe Dashboard.

---

## 9. O que está fora de escopo deste spec

- Design de UI das telas de paywall (tratado em spec separado)
- Integração de NF-e (terceirizado para fase 2)
- Sistema de afiliados/referral (fase 2)
- Copa 2030 pricing (fora do horizonte atual)
