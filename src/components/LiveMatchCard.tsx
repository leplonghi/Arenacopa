import { useEffect, useMemo, useState } from "react";
import { Flag } from "@/components/Flag";
import { useNavigate } from "react-router-dom";
import { Clock, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useTranslation } from "react-i18next";

type MatchCardRow = {
    id: string;
    match_date: string;
    home_team_code: string;
    away_team_code: string;
    home_score: number | null;
    away_score: number | null;
    status: "scheduled" | "live" | "finished";
};

type FirestoreMatchRow = {
    match_date?: string | { toDate?: () => Date };
    home_team_code?: string;
    away_team_code?: string;
    home_score?: number | null;
    away_score?: number | null;
    status?: string;
};

const normalizeMatchDate = (value: FirestoreMatchRow["match_date"]) => {
    if (!value) {
        return new Date(0).toISOString();
    }

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "object" && typeof value.toDate === "function") {
        return value.toDate().toISOString();
    }

    return new Date(0).toISOString();
};

const normalizeStatus = (status?: string): MatchCardRow["status"] => {
    const normalized = status?.toLowerCase();

    if (normalized === "live") return "live";
    if (normalized === "finished") return "finished";
    return "scheduled";
};

export function LiveMatchCard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('home');
    const [liveMatch, setLiveMatch] = useState<MatchCardRow | null>(null);
    const [nextMatch, setNextMatch] = useState<MatchCardRow | null>(null);
    const [hasPrediction, setHasPrediction] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<string>("");

    useEffect(() => {
        const matchesQuery = query(collection(db, "matches"), orderBy("match_date", "asc"));

        const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
            const now = Date.now();
            const matches = snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data() as FirestoreMatchRow;
                return {
                    id: docSnapshot.id,
                    match_date: normalizeMatchDate(data.match_date),
                    home_team_code: data.home_team_code || "---",
                    away_team_code: data.away_team_code || "---",
                    home_score: data.home_score ?? null,
                    away_score: data.away_score ?? null,
                    status: normalizeStatus(data.status),
                } satisfies MatchCardRow;
            });

            const currentLiveMatch = matches.find((match) => match.status === "live") || null;
            const currentNextMatch =
                matches.find((match) => match.status === "scheduled" && new Date(match.match_date).getTime() >= now) || null;

            setLiveMatch(currentLiveMatch);
            setNextMatch(currentLiveMatch ? null : currentNextMatch);
        });

        return () => unsubscribe();
    }, []);

    const activeLiveMatchId = useMemo(() => liveMatch?.id ?? null, [liveMatch?.id]);

    useEffect(() => {
        if (!user?.id || !activeLiveMatchId) {
            setHasPrediction(false);
            return;
        }

        const predictionsQuery = query(collection(db, "bolao_palpites"), where("user_id", "==", user.id));

        const unsubscribe = onSnapshot(predictionsQuery, (snapshot) => {
            const predicted = snapshot.docs.some((docSnapshot) => docSnapshot.data().match_id === activeLiveMatchId);
            setHasPrediction(predicted);
        });

        return () => unsubscribe();
    }, [activeLiveMatchId, user?.id]);

    useEffect(() => {
        if (!nextMatch) return;
        const intervalId = setInterval(() => {
            const now = new Date().getTime();
            const matchTime = new Date(nextMatch.match_date).getTime();
            const distance = matchTime - now;

            if (distance < 0) {
                clearInterval(intervalId);
                setCountdown(t('live_card.loading'));
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setCountdown(
                (days > 0 ? `${days}d ` : "") +
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(intervalId);
    }, [nextMatch]);

    if (!liveMatch && !nextMatch) return null;

    if (liveMatch) {
        return (
            <div className="w-full p-4 rounded-[32px] border border-copa-live/30 mb-6 bg-gradient-to-br from-white/[0.08] to-copa-live/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 left-0 bg-copa-live/15 h-1/2 blur-2xl pointer-events-none" />

                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-copa-live animate-pulse shadow-[0_0_8px_rgba(255,59,48,0.8)]" />
                        <span className="text-copa-live font-black text-xs uppercase tracking-widest">LIVE</span>
                    </div>
                    <span className="text-copa-live/80 font-bold text-xs">{t('live_card.live_label')}</span>
                </div>

                <div className="flex items-center justify-between relative z-10 mb-4 px-2">
                    <div className="flex flex-col items-center gap-2 w-1/3">
                        <Flag code={liveMatch.home_team_code} size="lg" className="shadow-lg border border-white/10" />
                        <span className="font-black text-sm text-center line-clamp-1">{liveMatch.home_team_code}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center w-1/3">
                        <div className="flex items-center gap-3 text-3xl font-black tabular-nums tracking-tighter text-white">
                            <span>{liveMatch.home_score ?? 0}</span>
                            <span className="text-muted-foreground/30 font-normal text-2xl">-</span>
                            <span>{liveMatch.away_score ?? 0}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 w-1/3">
                        <Flag code={liveMatch.away_team_code} size="lg" className="shadow-lg border border-white/10" />
                        <span className="font-black text-sm text-center line-clamp-1">{liveMatch.away_team_code}</span>
                    </div>
                </div>

                {hasPrediction && (
                    <button
                        onClick={() => navigate(`/boloes`)}
                        className="w-full mt-2 bg-copa-live/10 text-copa-live border border-copa-live/20 font-bold text-xs py-2.5 rounded-xl hover:bg-copa-live/20 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider relative z-10"
                    >
                        <Trophy className="w-4 h-4" />
                        {t('live_card.follow_btn')}
                    </button>
                )}
            </div>
        );
    }

    // Next Match View
    return (
        <div className="w-full surface-card-soft p-5 rounded-[32px] mb-6 relative overflow-hidden border-white/10 hover:border-white/20 transition-colors">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-primary font-black text-xs uppercase tracking-widest">{t('live_card.next_game')}</span>
                </div>
                <span className="text-muted-foreground font-bold text-xs font-mono">{countdown}</span>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3 flex-1">
                    <Flag code={nextMatch.home_team_code} size="md" className="shadow-md" />
                    <span className="font-black text-sm">{nextMatch.home_team_code}</span>
                </div>

                <span className="text-muted-foreground font-bold text-xs px-2">X</span>

                <div className="flex items-center justify-end gap-3 flex-1">
                    <span className="font-black text-sm">{nextMatch.away_team_code}</span>
                    <Flag code={nextMatch.away_team_code} size="md" className="shadow-md" />
                </div>
            </div>
        </div>
    );
}
