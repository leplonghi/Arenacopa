export function getArenaLevel(points: number | null | undefined) {
  const safePoints = Math.max(0, Number(points || 0));
  const level = Math.max(1, Math.floor(safePoints / 180) + 1);
  const currentLevelBase = (level - 1) * 180;
  const nextLevelBase = level * 180;
  const currentXp = safePoints - currentLevelBase;
  const maxXp = nextLevelBase - currentLevelBase;

  return {
    level,
    currentXp,
    maxXp,
    ratio: maxXp > 0 ? currentXp / maxXp : 0,
  };
}
