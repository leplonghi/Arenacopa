/**
 * setup-stripe.mjs
 *
 * Cria todos os produtos e preços do ArenaCopa no Stripe.
 * Roda uma vez; idempotente (pula se o produto já existir pelo metadata.key).
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe.mjs
 *
 * Após rodar, copie os price IDs retornados e configure os secrets:
 *   firebase functions:secrets:set STRIPE_PRICE_COPA_PASS
 *   firebase functions:secrets:set STRIPE_PRICE_PRO_MONTHLY
 *   firebase functions:secrets:set STRIPE_PRICE_PRO_ANNUAL
 *   firebase functions:secrets:set STRIPE_PRICE_B2B_POR_JOGO
 *   firebase functions:secrets:set STRIPE_PRICE_B2B_FASE_GRUPOS
 *   firebase functions:secrets:set STRIPE_PRICE_B2B_COPA_COMPLETA
 *   firebase functions:secrets:set STRIPE_PRICE_B2B_PARCEIRO_LOCAL
 *   firebase functions:secrets:set STRIPE_PRICE_B2B_PARCEIRO_NACIONAL
 *
 * Também crie o cupom de upgrade manualmente no Dashboard ou rode:
 *   node scripts/setup-stripe.mjs --coupon
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY não definida.");
  process.exit(1);
}

const stripe = new Stripe(key);
const ONLY_COUPON = process.argv.includes("--coupon");

// ─── Product definitions ──────────────────────────────────────────────────────

const PRODUCTS = [
  // B2C — one-time
  {
    key: "copa_pass_2026",
    secretName: "STRIPE_PRICE_COPA_PASS",
    name: "Copa Pass 2026",
    description: "Acesso completo à Copa do Mundo FIFA 2026 no ArenaCopa. Válido até 19/jul/2026.",
    amount: 1990,          // R$ 19,90
    currency: "brl",
    mode: "one_time",
  },
  // B2C — recurring
  {
    key: "pro_monthly",
    secretName: "STRIPE_PRICE_PRO_MONTHLY",
    name: "Arena PRO Mensal",
    description: "Acesso ilimitado ao ArenaCopa + Copa + Campeonatos. Cancele quando quiser.",
    amount: 2490,          // R$ 24,90/mês
    currency: "brl",
    mode: "recurring",
    interval: "month",
  },
  {
    key: "pro_annual",
    secretName: "STRIPE_PRICE_PRO_ANNUAL",
    name: "Arena PRO Anual",
    description: "Melhor valor: Arena PRO por 12 meses. Equivale a R$8,33/mês.",
    amount: 9990,          // R$ 99,90/ano
    currency: "brl",
    mode: "recurring",
    interval: "year",
  },
  // B2B — one-time campaigns
  {
    key: "b2b_por_jogo",
    secretName: "STRIPE_PRICE_B2B_POR_JOGO",
    name: "Campanha — Por Jogo",
    description: "Exposição da marca em 1 jogo. ~200 participantes alcançados.",
    amount: 5990,          // R$ 59,90
    currency: "brl",
    mode: "one_time",
  },
  {
    key: "b2b_fase_grupos",
    secretName: "STRIPE_PRICE_B2B_FASE_GRUPOS",
    name: "Campanha — Fase de Grupos",
    description: "8 jogos da fase de grupos. ~600 participantes alcançados.",
    amount: 19990,         // R$ 199,90
    currency: "brl",
    mode: "one_time",
  },
  {
    key: "b2b_copa_completa",
    secretName: "STRIPE_PRICE_B2B_COPA_COMPLETA",
    name: "Campanha — Copa Completa",
    description: "32 jogos, Copa inteira. ~1.500 participantes + logo no app.",
    amount: 44990,         // R$ 449,90
    currency: "brl",
    mode: "one_time",
  },
  // B2B — recurring parceiro
  {
    key: "b2b_parceiro_local",
    secretName: "STRIPE_PRICE_B2B_PARCEIRO_LOCAL",
    name: "Parceiro Local — Anual",
    description: "Presença de marca nos bolões da cidade. 1 campanha/mês inclusa. Dashboard + analytics.",
    amount: 29990,         // R$ 299,90/ano
    currency: "brl",
    mode: "recurring",
    interval: "year",
  },
  {
    key: "b2b_parceiro_nacional",
    secretName: "STRIPE_PRICE_B2B_PARCEIRO_NACIONAL",
    name: "Parceiro Nacional — Anual",
    description: "Presença nacional + 1 Fase de Grupos + 2x Por Jogo + analytics semanal.",
    amount: 69990,         // R$ 699,90/ano
    currency: "brl",
    mode: "recurring",
    interval: "year",
  },
];

// ─── Coupon: R$19,90 off first PRO Monthly (Copa Pass upgrade credit) ─────────

async function createUpgradeCoupon() {
  const couponId = "COPA_PASS_UPGRADE_2026";
  try {
    const existing = await stripe.coupons.retrieve(couponId);
    console.log(`✓ Cupom já existe: ${couponId} (${existing.name})`);
    return;
  } catch {
    // doesn't exist, create it
  }
  const coupon = await stripe.coupons.create({
    id: couponId,
    name: "Copa Pass → PRO: crédito R$19,90",
    amount_off: 1990,
    currency: "brl",
    duration: "once",
    metadata: { key: "copa_pass_upgrade_2026" },
  });
  console.log(`✅ Cupom criado: ${coupon.id}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (ONLY_COUPON) {
    await createUpgradeCoupon();
    return;
  }

  console.log("=== Setup Stripe — ArenaCopa ===\n");
  const results = [];

  for (const p of PRODUCTS) {
    // Check if product with this key already exists
    const existingProducts = await stripe.products.search({
      query: `metadata['key']:'${p.key}'`,
    });

    let product;
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`• Produto já existe: ${product.name} (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: p.name,
        description: p.description,
        metadata: { key: p.key },
      });
      console.log(`✅ Produto criado: ${product.name} (${product.id})`);
    }

    // Check if price already exists for this product
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    let price;
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      console.log(`   Preço existente: ${price.id} = R$${(price.unit_amount / 100).toFixed(2)}`);
    } else {
      const priceData = {
        product: product.id,
        unit_amount: p.amount,
        currency: p.currency,
        metadata: { key: p.key },
      };
      if (p.mode === "recurring") {
        priceData.recurring = { interval: p.interval };
      }
      price = await stripe.prices.create(priceData);
      console.log(`   ✅ Preço criado: ${price.id}`);
    }

    results.push({ secretName: p.secretName, priceId: price.id, name: p.name });
  }

  // Create coupon automatically
  await createUpgradeCoupon();

  console.log("\n=== Configure os secrets com os IDs abaixo ===\n");
  for (const r of results) {
    console.log(`firebase functions:secrets:set ${r.secretName}`);
    console.log(`  → ${r.priceId}  (${r.name})\n`);
  }

  console.log("=== Stripe configurado com sucesso ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
