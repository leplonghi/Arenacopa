export const appFeatureFlags = {
  discoverEnabled: true,
  communitiesLabelEnabled: true,
  businessRenameEnabled: true,
  creatorProEnabled: false,
  opportunityEngineEnabled: false,
  localSponsorsEnabled: false,
  rankingContextsEnabled: false,
} as const;

export type AppFeatureFlag = keyof typeof appFeatureFlags;

export function isFeatureEnabled(flag: AppFeatureFlag) {
  return Boolean(appFeatureFlags[flag]);
}
