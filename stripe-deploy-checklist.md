# Stripe Deploy Checklist

## Banco e schema
- Aplicar a migration [20260313000400_add_stripe_premium_subscriptions.sql](C:/Users/eduar/OneDrive/Desktop/Antigravity/ArenaCUP/ArenaCUP/supabase/migrations/20260313000400_add_stripe_premium_subscriptions.sql).
- Confirmar que a tabela `premium_subscriptions` existe com RLS ativa.
- Validar que a policy de leitura do proprio usuario esta funcionando.

## Segredos e ambiente
- Preencher o frontend com base em [.env.example](C:/Users/eduar/OneDrive/Desktop/Antigravity/ArenaCUP/ArenaCUP/.env.example).
- Configurar no Supabase os secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `SITE_URL`.
- Garantir `VITE_ENABLE_PREMIUM_SIMULATION=false` em producao.

## Deploy das Edge Functions
- Publicar `create-stripe-checkout`.
- Publicar `sync-stripe-checkout`.
- Publicar `stripe-webhook`.
- Testar localmente com `supabase functions serve` antes do deploy final.

## Stripe Dashboard
- Criar um `Price` de pagamento unico para o produto premium vitalicio.
- Copiar o `price_id` correto para `STRIPE_PREMIUM_PRICE_ID`.
- Registrar o webhook apontando para `/functions/v1/stripe-webhook`.
- Assinar os eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded` e `checkout.session.expired`.

## Validacao funcional
- Fazer login com usuario real.
- Abrir [Premium.tsx](C:/Users/eduar/OneDrive/Desktop/Antigravity/ArenaCUP/ArenaCUP/src/pages/Premium.tsx) e iniciar checkout.
- Testar cartao Stripe `4242 4242 4242 4242`.
- Confirmar retorno para `/premium?checkout=success&session_id=...`.
- Conferir se a tabela `premium_subscriptions` foi atualizada para `active`.
- Verificar se `isPremium` fica ativo no app e se anuncios/badges premium respondem corretamente.

## Observabilidade e operacao
- Revisar logs das tres Edge Functions no Supabase.
- Monitorar erros de webhook nas primeiras compras reais.
- Ter um plano de rollback: desligar o CTA premium ou reativar `VITE_ENABLE_PREMIUM_SIMULATION=true` temporariamente apenas em staging.
