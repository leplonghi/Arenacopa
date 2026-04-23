import type { ReactNode } from "react";
import { AchievementBadge } from "@/components/profile/AchievementBadge";

type AchievementItem = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  unlocked?: boolean;
};

export function AchievementRail({ items }: { items: AchievementItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <AchievementBadge
          key={item.id}
          title={item.title}
          description={item.description}
          icon={item.icon}
          unlocked={item.unlocked}
        />
      ))}
    </div>
  );
}
