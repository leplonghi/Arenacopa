import { useTranslation } from "react-i18next";
import {
    Users, BarChart3, TrendingUp,
} from "lucide-react";
import { type BolaoActivity, type BolaoData, type BolaoMarket, type MemberData, type Palpite } from "@/types/bolao";
import { useMatches } from "@/hooks/useMatches";
import { matches as mockMatches } from "@/data/mockData";
import { cn } from "@/lib/utils";


interface OverviewTabProps {
    bolao: BolaoData;
    members: MemberData[];
    isCreator: boolean;
    palpites: Palpite[];
    markets: BolaoMarket[];
    // [BUG-008 FIX] marketPredictions removed — prop existed but was never rendered;
    // the global listener that fed it has been removed from useBolaoDetail.
    activityFeed: BolaoActivity[];
    userId: string;
    onShare: () => void;
}



function formatActivityTime(value: string | undefined, locale: string, nowLabel: string) {
    if (!value) return nowLabel;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return nowLabel;
    return date.toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function OverviewTab({ bolao: _bolao, members, palpites, markets, activityFeed, userId, onShare: _onShare }: OverviewTabProps) {
    const { t, i18n } = useTranslation("bolao");
    const { data: firebaseMatches } = useMatches();
    const matches = firebaseMatches || mockMatches;

    const matchMarkets = markets.filter((m) => m.scope === "match");
    const uniqueMatchMarketIds = Array.from(new Set(matchMarkets.map((m) => m.match_id).filter(Boolean)));
    const exactScoreMarkets = matchMarkets.filter((m) => m.slug === "exact_score");
    const totalMatches =
        exactScoreMarkets.length ||
        uniqueMatchMarketIds.length ||
        matches.filter(m => m.phase === "groups").length;

    const myPalpites = palpites.filter(p => p.user_id === userId);
    const progress = totalMatches > 0 ? Math.round((myPalpites.length / totalMatches) * 100) : 0;



    return (
        <div className="space-y-4">
            {/* Compact stats row */}
            <div className="grid grid-cols-3 gap-2">
                <StatPill
                    icon={<Users className="w-4 h-4 text-emerald-400" />}
                    value={members.length}
                    label={t("overview.members_stat")}
                />
                <StatPill
                    icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
                    value={markets.length > 0 ? markets.length : myPalpites.length}
                    label={markets.length > 0 ? t("overview.stats_markets_sub") : t("overview.stats_predictions_sub")}
                />
                <StatPill
                    icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
                    value={`${progress}%`}
                    label={t("overview.stats_complete_sub")}
                >
                    <div className="mt-2 h-1 w-16 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-blue-400"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </StatPill>
            </div>

            {/* Activity Feed */}
            {activityFeed.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{t("overview.activity_title")}</p>
                    </div>
                    <div className="space-y-2">
                        {activityFeed.slice(0, 4).map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-3 py-1 border-b border-white/5 last:border-0">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-white leading-tight">{item.title}</p>
                                    {item.actor_name && (
                                        <p className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-primary/70">{item.actor_name}</p>
                                    )}
                                </div>
                                <span className="shrink-0 text-[9px] font-black uppercase tracking-wide text-zinc-600 mt-0.5">
                                    {formatActivityTime(item.created_at, i18n.resolvedLanguage || i18n.language, t("overview.activity_now"))}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatPill({ icon, value, label, children }: { icon: React.ReactNode; value: string | number; label: string; children?: React.ReactNode }) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center"
        )}>
            {icon}
            <span className="mt-1 text-base font-black text-white leading-none">{value}</span>
            <span className="mt-1 text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-tight">{label}</span>
            {children}
        </div>
    );
}
