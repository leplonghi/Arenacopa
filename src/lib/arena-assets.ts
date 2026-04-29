const AVAILABLE_ARENA_ASSETS = new Set([
  "brasileirao-logo.png",
  "bola-nav-fit.png",
  "bola-nav.png",
  "bundesliga-logo.png",
  "center-ball-nav.png",
  "champions-league-logo.png",
  "fundo-hero.png",
  "fundo-header.png",
  "home-palpites-hero-art.png",
  "libertadores-logo.png",
  "ligue1-logo.png",
  "premier-league-logo.png",
  "saudi-league-logo.png",
  "wc2026-trophy.png",
  "world-cup-badge.png",
]);

const OPTIMIZED_ARENA_ASSETS = new Set([
  "brasileirao-logo.webp",
  "bundesliga-logo.webp",
  "center-ball-nav.webp",
  "champions-league-logo.webp",
  "home-palpites-hero-art.webp",
  "libertadores-logo.webp",
  "ligue1-logo.webp",
  "premier-league-logo.webp",
  "saudi-league-logo.webp",
  "wc2026-trophy.webp",
  "world-cup-badge.webp",
]);

export function getArenaAssetSrc(assetName: string | null | undefined): string | null {
  if (!assetName || !AVAILABLE_ARENA_ASSETS.has(assetName)) {
    return null;
  }

  const optimizedName = assetName.replace(/\.png$/i, ".webp");
  if (OPTIMIZED_ARENA_ASSETS.has(optimizedName)) {
    return `/assets/arena/${optimizedName}`;
  }

  return `/assets/arena/${assetName}`;
}
