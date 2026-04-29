const COMMERCIAL_PLAN_DEFINITIONS = {
  single_match: {
    billing_mode: "one_time",
    included_games: 1,
    participant_limit: 100,
  },
  five_matches: {
    billing_mode: "one_time",
    included_games: 5,
    participant_limit: 250,
  },
  short_championship: {
    billing_mode: "one_time",
    included_games: 12,
    participant_limit: 500,
  },
  full_cup: {
    billing_mode: "one_time",
    included_games: 32,
    participant_limit: 1000,
  },
};

const LEGACY_PLAN_ALIASES = {
  unlimited_monthly: "full_cup",
  unlimited_annual: "full_cup",
};

function resolveCommercialPricingPlan(planId) {
  const normalizedPlanId = LEGACY_PLAN_ALIASES[planId] || planId;
  return {
    plan_id: normalizedPlanId in COMMERCIAL_PLAN_DEFINITIONS ? normalizedPlanId : "single_match",
    ...(COMMERCIAL_PLAN_DEFINITIONS[normalizedPlanId] || COMMERCIAL_PLAN_DEFINITIONS.single_match),
  };
}

module.exports = {
  resolveCommercialPricingPlan,
};
