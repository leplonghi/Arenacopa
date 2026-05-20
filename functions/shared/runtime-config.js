const { DEFAULT_SITE_URL } = require("./constants");

function readLegacyFunctionsConfig(functionsModule) {
  try {
    if (typeof functionsModule?.config === "function") {
      return functionsModule.config() || {};
    }
  } catch {
    return {};
  }
  return {};
}

function getRuntimeConfig(functionsModule) {
  const runtimeConfig = readLegacyFunctionsConfig(functionsModule);
  const appConfig = runtimeConfig.app || {};
  const seedConfig = runtimeConfig.seed || {};
  const stripeConfig = runtimeConfig.stripe || {};
  const footballDataConfig = runtimeConfig.football_data || runtimeConfig.footballdata || {};

  return {
    siteUrl: appConfig.site_url || process.env.SITE_URL || DEFAULT_SITE_URL,
    seedToken: seedConfig.token || process.env.SEED_TOKEN || "",
    footballDataApiKey: footballDataConfig.api_key || process.env.FOOTBALL_DATA_API_KEY || "",
    adminSecret: runtimeConfig.admin?.secret || process.env.ADMIN_SECRET || "",
    stripeSecretKey: stripeConfig.secret_key || process.env.STRIPE_SECRET_KEY || "",
    stripePremiumPriceId: stripeConfig.premium_price_id || process.env.STRIPE_PREMIUM_PRICE_ID || "",
    stripeCommercialCampaignPriceIds: {
      single_match:
        stripeConfig.commercial_campaign_single_match_price_id ||
        stripeConfig.commercial_campaign_price_ids?.single_match ||
        process.env.STRIPE_COMMERCIAL_CAMPAIGN_SINGLE_MATCH_PRICE_ID ||
        "",
      five_matches:
        stripeConfig.commercial_campaign_five_matches_price_id ||
        stripeConfig.commercial_campaign_price_ids?.five_matches ||
        process.env.STRIPE_COMMERCIAL_CAMPAIGN_FIVE_MATCHES_PRICE_ID ||
        "",
      short_championship:
        stripeConfig.commercial_campaign_short_championship_price_id ||
        stripeConfig.commercial_campaign_price_ids?.short_championship ||
        process.env.STRIPE_COMMERCIAL_CAMPAIGN_SHORT_CHAMPIONSHIP_PRICE_ID ||
        "",
      full_cup:
        stripeConfig.commercial_campaign_full_cup_price_id ||
        stripeConfig.commercial_campaign_price_ids?.full_cup ||
        process.env.STRIPE_COMMERCIAL_CAMPAIGN_FULL_CUP_PRICE_ID ||
        "",
    },
  };
}

module.exports = {
  getRuntimeConfig,
  readLegacyFunctionsConfig,
};
