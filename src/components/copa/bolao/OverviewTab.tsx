import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, TrendingUp, ChevronRight, UserPlus, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { matches, getTeam, type Match } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { type BolaoData, type MemberData, type Palpite } from "@/types/bolao";
import { MatchDetailsModal } from "@/components/copa/MatchDetailsModal";

interface OverviewTabProps {
    bolao: BolaoData;
    members: MemberData[];
    isCreator: boolean;
    palpites: Palpite[];
    userId: string;
    onShare: () => void;
}

export function OverviewTab({ bolao, members, palpites, userId, onShare }: OverviewTabProps) {
    const { t } = useTranslation('bolao');
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const navigate = useNavigate();
    const totalMatches = matches.filter(m => m.phase === "groups").length;
    const myPalpites = palpites.filter(p => p.user_id === userId);
    const progress = totalMatches > 0 ? Math.round((myPalpites.length / totalMatches) * 100) : 0;

    const nextMatches = matches
        .filter(m => m.status === "scheduled" && m.phase === "groups")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-4">
            <MatchDetailsModal
                match={selectedMatch}
                isOpen={!!selectedMatch}
                onClose={() => setSelectedMatch(null)}
            />

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-3 text-center">
                    <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <span className="text-lg font-black block">{members.length}</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{t('overview.members_stat')}</span>
                </div>
                <div className="glass-card p-3 text-center">
                    <BarChart3 className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <span className="text-lg font-black block">{myPalpites.length}</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{t('overview.palpites_stat')}</span>
                </div>
                <div className="glass-card p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <span className="text-lg font-black block">{progress}%</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{t('overview.progress_stat')}</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">{t('overview.your_palpites')}</span>
                    <span className="text-[10px] text-muted-foreground">{myPalpites.length}/{totalMatches} {t('overview.games')}</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--copa-gold-light))] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                {progress < 100 && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                        {t('overview.remaining_palpites', { count: totalMatches - myPalpites.length })}
                    </p>
                )}
            </div>

            {/* Next matches to predict */}
            {nextMatches.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">{t('overview.next_matches')}</h3>
                    <div className="space-y-2">
                        {nextMatches.map(m => {
                            const home = getTeam(m.homeTeam);
                            const away = getTeam(m.awayTeam);
                            const hasPalpite = myPalpites.some(p => p.match_id === m.id);
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMatch(m)}
                                    className={cn(
                                        "glass-card p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/40 transition-colors",
                                        hasPalpite && "border-[hsl(var(--copa-success))]/30"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <span
                                                className="cursor-pointer hover:scale-110 transition-transform"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/team/${home?.code}`); }}
                                            >{home?.flag}</span>
                                            <span
                                                className="text-xs cursor-pointer hover:underline"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/team/${home?.code}`); }}
                                            >{home?.code}</span>
                                            <span className="text-muted-foreground text-xs">vs</span>
                                            <span
                                                className="text-xs cursor-pointer hover:underline"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/team/${away?.code}`); }}
                                            >{away?.code}</span>
                                            <span
                                                className="cursor-pointer hover:scale-110 transition-transform"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/team/${away?.code}`); }}
                                            >{away?.flag}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(m.date), "dd MMM · HH:mm", { locale: ptBR })} · Grupo {m.group}
                                        </span>
                                    </div>
                                    {hasPalpite ? (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--copa-success))]/20 text-[hsl(var(--copa-success))] font-bold">✓</span>
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Invite card */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <span className="text-sm font-bold block">{t('overview.invite_friends')}</span>
                        <span className="text-[10px] text-muted-foreground">{t('overview.share_code')} <span className="font-black text-foreground tracking-wider">{bolao.invite_code}</span></span>
                    </div>
                </div>
                <button onClick={onShare} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" /> {t('overview.btn_share')}
                </button>
            </div>

            {/* Disclaimer */}
            <div className="glass-card p-3 border-dashed border-muted-foreground/20">
                <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
                    {t('overview.disclaimer')}
                </p>
            </div>
        </div>
    );
}
