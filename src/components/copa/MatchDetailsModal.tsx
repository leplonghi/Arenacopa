import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Match, getTeam, getStadium, formatMatchTime, formatMatchDate } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, Clock, Users, Sun, Globe, Newspaper, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { cn } from "@/lib/utils";

interface MatchDetailsModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

function TeamColumn({
  code,
  name,
  onClick,
}: {
  code: string;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-3 text-center transition hover:scale-[1.02]"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <Flag code={code} size="xl" className="h-14 w-14" />
      </div>
      <div>
        <p className="font-display text-[1.9rem] font-semibold uppercase leading-none text-white">
          {name}
        </p>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{code}</p>
      </div>
    </button>
  );
}

function NewsItem({
  title,
  source,
  time,
}: {
  title: string;
  source: string;
  time: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-primary/20 bg-primary/10 text-primary">
          <Newspaper className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-relaxed text-white">{title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
            <span className="text-primary">{source}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  left,
  label,
  right,
}: {
  left: string | number;
  label: string;
  right: string | number;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_64px] items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-center font-display text-[1.6rem] font-semibold uppercase text-white">{left}</div>
      <div className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="text-center font-display text-[1.6rem] font-semibold uppercase text-white">{right}</div>
    </div>
  );
}

export function MatchDetailsModal({ match, isOpen, onClose }: MatchDetailsModalProps) {
  const { t } = useTranslation("copa");
  const navigate = useNavigate();

  if (!match) return null;

  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);
  const stadium = getStadium(match.stadium);

  const news = [
    {
      id: 1,
      title: `${home.name} busca vitória importante`,
      source: "Globo Esporte",
      time: "2h atrás",
    },
    {
      id: 2,
      title: `Técnico da ${away.name} faz mistério sobre escalação`,
      source: "UOL Esporte",
      time: "4h atrás",
    },
    {
      id: 3,
      title: "Expectativa de grande público para o confronto",
      source: "FIFA+",
      time: "5h atrás",
    },
  ];

  const statusText =
    match.status === "live"
      ? t("match_card.live")
      : match.status === "finished"
        ? t("match_details.status_finished", "Encerrado")
        : t("match_details.status_upcoming", "Em breve");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden rounded-[34px] border-white/10 bg-[#04110c]/96 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:max-w-[640px]">
        <DialogTitle className="sr-only">
          {t("match_details.sr_title", { home: home.name, away: away.name })}
        </DialogTitle>

        <Tabs defaultValue="summary" className="w-full">
          <div className="border-b border-white/10 px-5 pt-5">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-[22px] bg-transparent p-0">
              <TabsTrigger
                value="summary"
                className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 font-display text-[1rem] font-semibold uppercase tracking-[0.08em] text-zinc-400 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/12 data-[state=active]:text-primary"
              >
                {t("match_details.tabs.summary")}
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 font-display text-[1rem] font-semibold uppercase tracking-[0.08em] text-zinc-400 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/12 data-[state=active]:text-primary"
              >
                {t("match_details.tabs.comparison")}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[76vh]">
            <TabsContent value="summary" className="m-0 p-5 focus-visible:ring-0">
              <div className="space-y-4">
                <ArenaPanel tone="strong" className="overflow-hidden p-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,193,7,0.22),transparent_20%),radial-gradient(circle_at_15%_0%,rgba(145,255,59,0.14),transparent_26%)]" />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <div className="arena-badge">
                        <Clock className="h-3.5 w-3.5" />
                        {match.group
                          ? t("match_details.group_label", { group: match.group })
                          : t("match_details.phase_label", { phase: match.phase })}
                      </div>
                      <div
                        className={cn(
                          "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                          match.status === "live"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-300",
                        )}
                      >
                        {statusText}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                      <TeamColumn
                        code={home.code}
                        name={home.name}
                        onClick={() => navigate(`/team/${home.code}`)}
                      />

                      <div className="text-center">
                        {match.status === "finished" || match.status === "live" ? (
                          <div className="font-display text-[4.2rem] font-semibold leading-none tracking-[0.02em] text-white">
                            {match.homeScore} <span className="text-white/25">x</span> {match.awayScore}
                          </div>
                        ) : (
                          <div className="font-display text-[3.6rem] font-semibold uppercase tracking-[0.05em] text-white/30">
                            VS
                          </div>
                        )}
                        {match.minute ? (
                          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                            {match.minute}'
                          </p>
                        ) : (
                          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                            {formatMatchDate(match.date)} • {formatMatchTime(match.date)}
                          </p>
                        )}
                      </div>

                      <TeamColumn
                        code={away.code}
                        name={away.name}
                        onClick={() => navigate(`/team/${away.code}`)}
                      />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <ArenaMetric label={t("match_details.hero.date", "Data")} value={formatMatchDate(match.date)} icon={<Calendar className="h-5 w-5" />} />
                      <ArenaMetric label={t("match_details.hero.time", "Hora")} value={formatMatchTime(match.date)} icon={<Clock className="h-5 w-5" />} />
                      <ArenaMetric
                        label={t("match_details.hero.stage", "Fase")}
                        value={match.group ? `Grupo ${match.group}` : match.phase}
                        icon={<ArrowRight className="h-5 w-5" />}
                        accent
                      />
                    </div>
                  </div>
                </ArenaPanel>

                <ArenaPanel className="p-5">
                  <ArenaSectionHeader
                    eyebrow={t("match_details.location_title")}
                    title={stadium?.name ?? "Estádio"}
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <ArenaMetric
                      label={t("match_details.location_city", "Cidade")}
                      value={`${stadium?.city ?? "-"}, ${stadium?.country ?? "-"}`}
                      icon={<MapPin className="h-5 w-5" />}
                    />
                    <ArenaMetric
                      label={t("match_details.stadium_info.capacity")}
                      value={stadium?.capacity?.toLocaleString() ?? "-"}
                      icon={<Users className="h-5 w-5" />}
                    />
                    <ArenaMetric
                      label={t("match_details.stadium_info.climate")}
                      value={stadium?.climaHint ?? "-"}
                      icon={<Sun className="h-5 w-5" />}
                    />
                    <ArenaMetric
                      label={t("match_details.stadium_info.timezone")}
                      value={stadium?.timezone?.split("/")[1]?.replace("_", " ") ?? "-"}
                      icon={<Globe className="h-5 w-5" />}
                    />
                  </div>
                </ArenaPanel>

                <ArenaPanel className="p-5">
                  <ArenaSectionHeader
                    eyebrow={t("match_details.news_title")}
                    title="Radar da partida"
                  />
                  <div className="mt-4 space-y-3">
                    {news.map((item) => (
                      <NewsItem key={item.id} title={item.title} source={item.source} time={item.time} />
                    ))}
                  </div>
                </ArenaPanel>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="m-0 p-5 focus-visible:ring-0">
              <div className="space-y-4">
                <ArenaPanel tone="strong" className="p-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <Flag code={home.code} size="lg" className="h-14 w-14" />
                      <p className="font-display text-[1.6rem] font-semibold uppercase leading-none text-white">{home.name}</p>
                    </div>
                    <div className="font-display text-[2.6rem] font-semibold uppercase text-white/30">VS</div>
                    <div className="flex flex-col items-center gap-2">
                      <Flag code={away.code} size="lg" className="h-14 w-14" />
                      <p className="font-display text-[1.6rem] font-semibold uppercase leading-none text-white">{away.name}</p>
                    </div>
                  </div>
                </ArenaPanel>

                <ArenaPanel className="p-5">
                  <ArenaSectionHeader eyebrow="Comparativo" title="Força e histórico" />
                  <div className="mt-4 space-y-3">
                    <ComparisonRow
                      left={home.stats?.titles || 0}
                      label={t("match_details.comparison.titles_label")}
                      right={away.stats?.titles || 0}
                    />
                    <ComparisonRow
                      left={`#${home.fifaRanking}`}
                      label={t("match_details.comparison.ranking_label")}
                      right={`#${away.fifaRanking}`}
                    />
                    <ComparisonRow
                      left={home.stats?.appearances || "-"}
                      label={t("match_details.comparison.appearances_label")}
                      right={away.stats?.appearances || "-"}
                    />
                    <ComparisonRow
                      left={home.stats?.bestResult || "-"}
                      label={t("match_details.comparison.best_result_label")}
                      right={away.stats?.bestResult || "-"}
                    />
                    <ComparisonRow
                      left={home.stats?.hdi || "-"}
                      label={t("match_details.comparison.hdi")}
                      right={away.stats?.hdi || "-"}
                    />
                    <ComparisonRow
                      left={home.demographics?.population || "-"}
                      label={t("match_details.comparison.population")}
                      right={away.demographics?.population || "-"}
                    />
                    <ComparisonRow
                      left={home.stats?.gdp ? `$${home.stats.gdp}B` : "-"}
                      label={t("match_details.comparison.gdp")}
                      right={away.stats?.gdp ? `$${away.stats.gdp}B` : "-"}
                    />
                  </div>
                </ArenaPanel>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
