import { ArenaTabPill } from "@/components/arena/ArenaPrimitives";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  badge: number | null;
}

interface BolaoTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: any) => void;
}

export function BolaoTabs({ tabs, activeTab, onTabChange }: BolaoTabsProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="text-left"
        >
          <ArenaTabPill
            active={activeTab === tab.id}
            className={cn(
              "relative flex min-h-[58px] w-full rounded-[22px] px-4 py-3 text-[11px] tracking-[0.16em]",
              activeTab !== tab.id && "hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            {tab.label}
            {tab.badge !== null && tab.badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">
                {tab.badge}
              </span>
            )}
          </ArenaTabPill>
        </button>
      ))}
    </div>
  );
}
