import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

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

export function useLevelNotifier(points: number | undefined) {
  const { toast } = useToast();
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (points === undefined) return;
    
    const currentLevel = getArenaLevel(points).level;
    
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      toast({
        title: "Você subiu de nível! 🎉",
        description: `Parabéns! Você alcançou o nível ${currentLevel} no ArenaCup.`,
      });
    }
    
    prevLevelRef.current = currentLevel;
  }, [points, toast]);
}
