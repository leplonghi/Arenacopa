import { useAuth } from "@/contexts/AuthContext";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useAchievementTracker } from "@/hooks/useAchievementTracker";

export function GlobalAchievementTracker() {
  const { user } = useAuth();
  const { data: stats } = useProfileStats(user?.id);
  
  // This hook handles the logic of detecting new achievements 
  // and triggering the UI (toast/confetti)
  useAchievementTracker(stats);

  return null; // Invisible component
}
