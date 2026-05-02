import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface Stats {
  totalPredictions?: number;
  exactScores?: number;
  createdBoloes?: number;
  titles?: number;
  points?: number;
}

export function useAchievementTracker(stats: Stats | undefined) {
  const { toast } = useToast();
  const prevAchievementsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!stats) return;

    const currentAchievements = new Set<string>();
    
    if ((stats.totalPredictions || 0) > 0) currentAchievements.add("primeiro_palpite");
    if ((stats.exactScores || 0) > 0) currentAchievements.add("placar_exato");
    if ((stats.createdBoloes || 0) > 0) currentAchievements.add("criador_bolao");
    if ((stats.exactScores || 0) >= 3) currentAchievements.add("combo_3");
    if ((stats.titles || 0) > 0) currentAchievements.add("campeao");
    
    // Check for level ups (every 5 levels?)
    // But points are better for levels.
    
    // Sync with localStorage to persist across sessions
    const stored = localStorage.getItem("seen_achievements");
    const seen = new Set<string>(stored ? JSON.parse(stored) : []);
    
    const newAchievements = Array.from(currentAchievements).filter(id => !seen.has(id));
    
    if (newAchievements.length > 0) {
      newAchievements.forEach(id => {
        const info = getAchievementInfo(id);
        if (info) {
          toast({
            title: `🏆 Conquista Desbloqueada!`,
            description: `${info.title}: ${info.desc}`,
            className: "bg-copa-gold text-black font-black border-none shadow-[0_0_20px_rgba(255,196,0,0.5)]",
          });
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFC400', '#FFFFFF', '#22C55E']
          });
        }
        seen.add(id);
      });
      localStorage.setItem("seen_achievements", JSON.stringify(Array.from(seen)));
    }
    
    prevAchievementsRef.current = currentAchievements;
  }, [stats, toast]);
}

function getAchievementInfo(id: string) {
  const map: Record<string, { title: string, desc: string }> = {
    "primeiro_palpite": { title: "Pé Quente", desc: "Você fez seu primeiro palpite!" },
    "placar_exato": { title: "Sniper", desc: "Acertou seu primeiro placar exato!" },
    "criador_bolao": { title: "Dono da Bola", desc: "Criou seu próprio bolão!" },
    "combo_3": { title: "Hat-trick", desc: "Acertou 3 placares exatos!" },
    "campeao": { title: "Campeão", desc: "Venceu seu primeiro bolão!" },
  };
  return map[id];
}
