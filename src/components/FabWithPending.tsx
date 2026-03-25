import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Flag } from "@/components/Flag";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useTranslation } from "react-i18next";

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

type FirestoreMatchRow = PendingMatch & {
  status?: string;
};

const normalizeMatchDate = (value: string | { toDate?: () => Date } | undefined) => {
  if (!value) return new Date(0).toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(0).toISOString();
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
  const { t } = useTranslation("bolao");
  const [pendingItems, setPendingItems] = useState<PendingPredictionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const isDemoMode = localStorage.getItem("demo_mode") === "true";

  const fetchPending = useCallback(async () => {
    if (!user?.id || isDemoMode) {
      setPendingItems([]);
      return;
    }

    try {
      const membershipsSnapshot = await getDocs(
        query(collection(db, "bolao_members"), where("user_id", "==", user.id))
      );

      const memberships = membershipsSnapshot.docs.map((docSnapshot) => docSnapshot.data() as MembershipRow);

      if (!memberships.length) {
        setPendingItems([]);
        return;
      }

      const bolaoIds = memberships.map((m: MembershipRow) => m.bolao_id);

      const [matchesSnapshot, predictionsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "matches"), orderBy("match_date", "asc"))),
        getDocs(query(collection(db, "bolao_palpites"), where("user_id", "==", user.id))),
      ]);

      const now = Date.now();
      const upcomingMatches = matchesSnapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as FirestoreMatchRow & { match_date?: string | { toDate?: () => Date } };
          return {
            id: docSnapshot.id,
            stage: data.stage || null,
            home_team_code: data.home_team_code || null,
            away_team_code: data.away_team_code || null,
            match_date: normalizeMatchDate(data.match_date),
            status: data.status,
          };
        })
        .filter((match) => (match.status || "").toLowerCase() === "scheduled")
        .filter((match) => new Date(match.match_date).getTime() >= now)
        .slice(0, 20);

      if (!upcomingMatches.length) {
        setPendingItems([]);
        return;
      }

      const matchIds = upcomingMatches.map((m) => m.id);

      const existingPredictions = predictionsSnapshot.docs
        .map((docSnapshot) => docSnapshot.data() as PredictionRow)
        .filter((row) => bolaoIds.includes(row.bolao_id) && matchIds.includes(row.match_id));

      const predictionsIndex = new Map<string, Set<string>>();
      (existingPredictions || []).forEach((row: PredictionRow) => {
        if (!predictionsIndex.has(row.match_id)) {
          predictionsIndex.set(row.match_id, new Set());
        }
        (predictionsIndex.get(row.match_id) as Set<string>).add(row.bolao_id);
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
    } catch (error) {
      console.error("Error loading pending predictions:", error);
      setPendingItems([]);
    }
  }, [isDemoMode, user?.id]);

  useEffect(() => {
    if (!user?.id || isDemoMode) {
      setPendingItems([]);
      return;
    }

    void fetchPending();

    const membershipQuery = query(collection(db, "bolao_members"), where("user_id", "==", user.id));
    const predictionsQuery = query(collection(db, "bolao_palpites"), where("user_id", "==", user.id));
    const matchesQuery = query(collection(db, "matches"), orderBy("match_date", "asc"));

    const unsubscribeMemberships = onSnapshot(membershipQuery, () => {
      void fetchPending();
    });
    const unsubscribePredictions = onSnapshot(predictionsQuery, () => {
      void fetchPending();
    });
    const unsubscribeMatches = onSnapshot(matchesQuery, () => {
      void fetchPending();
    });

    const intervalId = window.setInterval(() => {
      void fetchPending();
    }, 30000);

    return () => {
      unsubscribeMemberships();
      unsubscribePredictions();
      unsubscribeMatches();
      window.clearInterval(intervalId);
    };
  }, [fetchPending, isDemoMode, user?.id]);

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
    <div className="relative flex h-full flex-col items-center justify-center gap-1 py-2">
      {/* ── Ball container — protrudes upward ── */}
      <div
        className={cn(
          "absolute -top-[28px] left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-300 rounded-full",
          isActive ? "scale-[1.12] shadow-[0_4px_25px_rgba(34,197,94,0.6)]" : "scale-100 hover:scale-[1.05] active:scale-95 shadow-[0_4px_15px_rgba(34,197,94,0.4)]"
        )}
        style={{ width: 68, height: 68 }}
      >
        {/* Glowing Gradient Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1A4D2E] via-[#22c55e] to-emerald-400 animate-pulse-slow shadow-lg">
          {/* Inner Ball Container */}
          <div className="relative w-full h-full rounded-full bg-black/90 flex items-center justify-center overflow-hidden">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/arenacopa-web-2026.firebasestorage.app/o/assets%2Fbola_oficial_bw.png?alt=media&token=a21b815e-3b09-4c80-81e1-7f3164f04ebb" 
              alt="Bolão" 
              className={cn(
                "w-full h-full object-cover transition-all duration-300 scale-[1.05]",
                isActive ? "brightness-125" : "brightness-100"
              )} 
            />
            {isActive && <div className="absolute inset-0 bg-white/5 rounded-full" />}
          </div>
        </div>

        {/* Pending-predictions badge */}
        {totalMissingPredictions > 0 && (
          <span className="absolute right-1 top-2 min-w-[20px] h-[20px] rounded-full bg-red-600 flex items-center justify-center px-1 text-[9px] font-black text-white shadow-lg ring-2 ring-[#0f3a21] z-10">
            {totalMissingPredictions > 9 ? "9+" : totalMissingPredictions}
          </span>
        )}
      </div>

      {/* Spacer to match icon height from other nav items */}
      <div className="h-5 w-5 invisible" />

      {/* Navigation Label - Matches Layout.tsx logic exactly */}
      <span className={cn(
        "text-[10px] leading-none transition-colors",
        isActive ? "text-primary font-bold" : "text-muted-foreground font-medium"
      )}>
        {t('nav.bolao', { defaultValue: 'Bolões' })}
      </span>
    </div>
  );

  if (!pendingItems.length) {
    return (
      <NavLink
        to="/boloes"
        aria-label={t('page.kicker')}
        className={cn(
          "inline-flex h-full items-center justify-center",
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
        <button aria-label={t('page.kicker')} className={cn("inline-flex h-full items-center justify-center", className)}>{fabButton}</button>
      </SheetTrigger>
      <SheetContent side="bottom" className="border-white/10 bg-zinc-950 text-white">
        <SheetHeader>
          <SheetTitle className="text-left text-white">{t('fab.pending_title')}</SheetTitle>
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
                      {item.match.stage || t('fab.group_stage')}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-zinc-300">
                      <Clock className="h-4 w-4" />
                      {dateString}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                    {t('fab.pending_count', { count: item.bolaoIds.length })}
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
                  {t('fab.go_to_predictions')}
                </button>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
