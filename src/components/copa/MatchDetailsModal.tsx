import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Match, getTeam, getStadium, formatMatchTime, formatMatchDate } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, Clock, Users, Sun, Globe, Newspaper } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MatchDetailsModalProps {
    match: Match | null;
    isOpen: boolean;
    onClose: () => void;
}

export function MatchDetailsModal({ match, isOpen, onClose }: MatchDetailsModalProps) {
    const { t } = useTranslation('copa');
    const navigate = useNavigate();
    if (!match) return null;

    const home = getTeam(match.homeTeam);
    const away = getTeam(match.awayTeam);
    const stadium = getStadium(match.stadium);

    // Mock news data based on teams
    const news = [
        {
            id: 1,
            title: `${home.name} busca vitória importante`,
            source: "Globo Esporte",
            time: "2h atrás",
            image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80"
        },
        {
            id: 2,
            title: `Técnico da ${away.name} faz mistério sobre escalação`,
            source: "UOL Esporte",
            time: "4h atrás",
            image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80"
        },
        {
            id: 3,
            title: "Expectativa de grande público para o confronto",
            source: "FIFA+",
            time: "5h atrás",
            image: "https://images.unsplash.com/photo-1434648957308-5e6a859697e8?auto=format&fit=crop&w=300&q=80"
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl rounded-[32px]">
                <DialogTitle className="sr-only">
                    {t('match_details.sr_title', { home: home.name, away: away.name })}
                </DialogTitle>
                <Tabs defaultValue="comparison" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-white/10 rounded-none h-12 p-0">
                        <TabsTrigger
                            value="summary"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full font-bold uppercase tracking-wider text-xs"
                        >
                            {t('match_details.tabs.summary')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="comparison"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full font-bold uppercase tracking-wider text-xs"
                        >
                            {t('match_details.tabs.comparison')}
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="max-h-[70vh]">
                        <TabsContent value="summary" className="m-0 focus-visible:ring-0">
                            {/* Header Image / Stadium Banner */}
                            <div className="relative h-48 w-full">
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
                                <img
                                    src="https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&w=800&q=80"
                                    alt={stadium?.name}
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute top-4 left-4 z-20">
                                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                                        {match.group ? t('match_details.group_label', { group: match.group }) : t(`match_details.phase_label`, { phase: match.phase })}
                                    </span>
                                </div>
                            </div>

                            <div className="px-6 -mt-12 relative z-20 space-y-6 pb-8">
                                {/* Matchup Card */}
                                <div className="glass-card p-6 border-white/10 shadow-xl bg-card/50 rounded-[24px]">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className="flex flex-col items-center gap-2 w-1/3 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => navigate(`/team/${home.code}`)}
                                        >
                                            <div className="relative">
                                                <Flag code={home.code} size="xl" className="w-16 h-16 shadow-lg rounded-full" />
                                            </div>
                                            <span className="text-sm font-black text-center leading-tight hover:underline">{home.name}</span>
                                        </div>

                                        <div className="flex flex-col items-center justify-center w-1/3">
                                            {match.status === 'finished' || match.status === 'live' ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl font-black">{match.homeScore}</span>
                                                    <span className="text-muted-foreground">-</span>
                                                    <span className="text-3xl font-black">{match.awayScore}</span>
                                                </div>
                                            ) : (
                                                <div className="text-center space-y-1">
                                                    <span className="text-2xl font-black text-muted-foreground">vs</span>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-copa-green-light">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatMatchTime(match.date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{formatMatchDate(match.date)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="flex flex-col items-center gap-2 w-1/3 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => navigate(`/team/${away.code}`)}
                                        >
                                            <div className="relative">
                                                <Flag code={away.code} size="xl" className="w-16 h-16 shadow-lg rounded-full" />
                                            </div>
                                            <span className="text-sm font-black text-center leading-tight hover:underline">{away.name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stadium Info */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-copa-green-light">
                                        <MapPin className="w-4 h-4" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider">{t('match_details.location_title')}</h3>
                                    </div>

                                    <div className="glass-card p-4 space-y-3 rounded-[24px]">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-lg">{stadium?.name}</h4>
                                                <p className="text-sm text-muted-foreground">{stadium?.city}, {stadium?.country}</p>
                                            </div>
                                        </div>

                                        <Separator className="bg-white/5" />

                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{t('match_details.stadium_info.capacity')}: <b className="text-foreground">{stadium?.capacity.toLocaleString()}</b></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Sun className="w-3.5 h-3.5" />
                                                <span>{t('match_details.stadium_info.climate')}: <b className="text-foreground">{stadium?.climaHint}</b></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Globe className="w-3.5 h-3.5" />
                                                <span>{t('match_details.stadium_info.timezone')}: <b className="text-foreground">{stadium?.timezone.split('/')[1].replace('_', ' ')}</b></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* News Feed */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-copa-green-light">
                                        <Newspaper className="w-4 h-4" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider">{t('match_details.news_title')}</h3>
                                    </div>

                                    <div className="space-y-2">
                                        {news.map((item) => (
                                            <div key={item.id} className="glass-card p-2 flex gap-3 hover:bg-white/5 transition-colors cursor-pointer group rounded-[24px]">
                                                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative">
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="flex flex-col justify-center gap-1">
                                                    <h4 className="text-sm font-bold leading-tight line-clamp-2">{item.title}</h4>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                        <span className="text-copa-green-light font-medium">{item.source}</span>
                                                        <span>•</span>
                                                        <span>{item.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="comparison" className="p-6 space-y-6 focus-visible:ring-0">
                            {/* Comparison Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col items-center">
                                    <Flag code={home.code} size="lg" className="mb-2 shadow-lg" />
                                    <span className="font-bold text-sm text-center">{home.name}</span>
                                </div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">VS</div>
                                <div className="flex flex-col items-center">
                                    <Flag code={away.code} size="lg" className="mb-2 shadow-lg" />
                                    <span className="font-bold text-sm text-center">{away.name}</span>
                                </div>
                            </div>

                            {/* Comparison Rows */}
                            <div className="space-y-4">
                                {/* Titles */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider font-bold px-2">
                                        <span>{t('match_details.comparison.titles')}</span>
                                    </div>
                                    <div className="glass-card p-3 flex items-center justify-between rounded-[24px]">
                                        <div className="font-black text-lg w-12 text-center">{home.stats?.titles || 0}</div>
                                        <h4 className="text-xs text-muted-foreground text-center flex-1">{t('match_details.comparison.titles_label')}</h4>
                                        <div className="font-black text-lg w-12 text-center">{away.stats?.titles || 0}</div>
                                    </div>
                                </div>

                                {/* Ranking */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider font-bold px-2">
                                        <span>{t('match_details.comparison.ranking')}</span>
                                    </div>
                                    <div className="glass-card p-3 flex items-center justify-between rounded-[24px]">
                                        <div className="font-black text-lg w-12 text-center">#{home.fifaRanking}</div>
                                        <h4 className="text-xs text-muted-foreground text-center flex-1">{t('match_details.comparison.ranking_label')}</h4>
                                        <div className="font-black text-lg w-12 text-center">#{away.fifaRanking}</div>
                                    </div>
                                    {/* Progress bar comparison */}
                                    <div className="flex gap-1 h-1.5 mt-1">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${(100 - (home.fifaRanking || 100))}%` }} />
                                        <div className="h-full bg-copa-blue rounded-full ml-auto" style={{ width: `${(100 - (away.fifaRanking || 100))}%` }} />
                                    </div>
                                </div>

                                {/* Appearances & Best Result */}
                                <div className="glass-card p-4 space-y-4 rounded-[24px]">
                                    <div className="grid grid-cols-3 items-center text-center text-sm">
                                        <div className="font-bold">{home.stats?.appearances || '-'}</div>
                                        <div className="text-xs text-muted-foreground uppercase">{t('match_details.comparison.appearances_label')}</div>
                                        <div className="font-bold">{away.stats?.appearances || '-'}</div>
                                    </div>
                                    <Separator className="bg-white/5" />
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2">
                                        <div className="text-xs font-medium leading-tight">{home.stats?.bestResult || '-'}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase px-2">{t('match_details.comparison.best_result_label')}</div>
                                        <div className="text-xs font-medium leading-tight">{away.stats?.bestResult || '-'}</div>
                                    </div>
                                </div>

                                {/* General Stats */}
                                <div className="glass-card p-0 overflow-hidden rounded-[24px]">
                                    <div className="p-2 bg-white/5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('match_details.comparison.demographics_title')}</div>
                                    <div className="divide-y divide-white/5">
                                        <div className="grid grid-cols-3 items-center p-3 text-xs">
                                            <div className="text-center font-medium">{home.stats?.hdi || '-'}</div>
                                            <div className="text-center text-muted-foreground">{t('match_details.comparison.hdi')}</div>
                                            <div className="text-center font-medium">{away.stats?.hdi || '-'}</div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center p-3 text-xs">
                                            <div className="text-center font-medium">{home.demographics?.population || '-'}</div>
                                            <div className="text-center text-muted-foreground">{t('match_details.comparison.population')}</div>
                                            <div className="text-center font-medium">{away.demographics?.population || '-'}</div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center p-3 text-xs">
                                            <div className="text-center font-medium">{home.stats?.gdp ? `$${home.stats.gdp}B` : '-'}</div>
                                            <div className="text-center text-muted-foreground">{t('match_details.comparison.gdp')}</div>
                                            <div className="text-center font-medium">{away.stats?.gdp ? `$${away.stats.gdp}B` : '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
