import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Flag } from "@/components/Flag";

type PendingMatch = {
  id: string;
  stage: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  match_date: string;
};

type PendingPredictionItem = {
  match: PendingMatch;
  bolaoIds: string[];
};

type MembershipRow = {
  bolao_id: string;
};

type PredictionRow = {
  match_id: string;
  bolao_id: string;
};

export function FabWithPending({
  className,
  isActive,
}: {
  className?: string;
  isActive?: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingItems, setPendingItems] = useState<PendingPredictionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      const { data: memberships, error: membershipError } = await supabase
        .from("bolao_members")
        .select("bolao_id")
        .eq("user_id", user.id);

      if (membershipError || !memberships?.length) {
        setPendingItems([]);
        return;
      }

      const bolaoIds = memberships.map((m: MembershipRow) => m.bolao_id);

      const now = new Date().toISOString();
      const { data: upcomingMatches, error: matchesError } = await supabase
        .from("matches")
        .select("id, stage, home_team_code, away_team_code, match_date")
        .eq("status", "scheduled")
        .gte("match_date", now)
        .order("match_date", { ascending: true })
        .limit(20);

      if (matchesError || !upcomingMatches?.length) {
        setPendingItems([]);
        return;
      }

      const matchIds = upcomingMatches.map((m: PendingMatch) => m.id);

      const { data: existingPredictions } = await supabase
        .from("bolao_palpites")
        .select("match_id, bolao_id")
        .eq("user_id", user.id)
        .in("bolao_id", bolaoIds)
        .in("match_id", matchIds);

      const predictionsIndex = new Map<string, Set<string>>();
      (existingPredictions || []).forEach((row: PredictionRow) => {
        if (!predictionsIndex.has(row.match_id)) {
          predictionsIndex.set(row.match_id, new Set());
        }
        predictionsIndex.get(row.match_id)!.add(row.bolao_id);
      });

      const pending = upcomingMatches
        .map((match: PendingMatch) => {
          const predictedIn = predictionsIndex.get(match.id) || new Set<string>();
          const missingFor = bolaoIds.filter((id: string) => !predictedIn.has(id));
          if (!missingFor.length) return null;
          return {
            match,
            bolaoIds: missingFor,
          } satisfies PendingPredictionItem;
        })
        .filter(Boolean) as PendingPredictionItem[];

      setPendingItems(pending);
    };

    fetchPending();

    const channel = supabase
      .channel(`pending-predictions-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bolao_palpites", filter: `user_id=eq.${user.id}` },
        fetchPending
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalMissingPredictions = useMemo(
    () => pendingItems.reduce((acc, item) => acc + item.bolaoIds.length, 0),
    [pendingItems]
  );

  const handleOpenPrediction = (item: PendingPredictionItem) => {
    setIsOpen(false);
    const targetBolaoId = item.bolaoIds[0];
    navigate(`/boloes/${targetBolaoId}?match=${item.match.id}&tab=jogos`);
  };

  const fabButton = (
    <div
      className={cn(
        "relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary text-black shadow-[0_10px_30px_rgba(34,197,94,0.35)]",
        "transition-transform hover:scale-105"
      )}
    >
      <span className="text-xl">⚽</span>
      {totalMissingPredictions > 0 && (
        <span className="absolute -right-1 -top-1 min-w-6 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
          {totalMissingPredictions}
        </span>
      )}
    </div>
  );

  if (!pendingItems.length) {
    return (
      <NavLink
        to="/boloes"
        className={cn(
          "inline-flex items-center justify-center",
          isActive ? "opacity-100" : "opacity-95",
          className
        )}
      >
        {fabButton}
      </NavLink>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className={cn("inline-flex items-center justify-center", className)}>{fabButton}</button>
      </SheetTrigger>
      <SheetContent side="bottom" className="border-white/10 bg-zinc-950 text-white">
        <SheetHeader>
          <SheetTitle className="text-left text-white">Palpites pendentes</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {pendingItems.map((item) => {
            const date = new Date(item.match.match_date);
            const dateString = `${date.toLocaleDateString("pt-BR")} • ${date.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}`;

            return (
              <div
                key={item.match.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                      {item.match.stage || "Fase de grupos"}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-zinc-300">
                      <Clock className="h-4 w-4" />
                      {dateString}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                    {item.bolaoIds.length} pendência{item.bolaoIds.length > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Flag code={item.match.home_team_code || ""} />
                    <span>{item.match.home_team_code || "---"}</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">x</span>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Flag code={item.match.away_team_code || ""} />
                    <span>{item.match.away_team_code || "---"}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPrediction(item)}
                  className="mt-3 w-full rounded-xl border border-primary/30 bg-primary/20 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/30"
                >
                  Ir para palpites
                </button>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
