import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, GitBranch, Loader2, Trophy } from "lucide-react";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { PredictionValue } from "@/types/bolao";

type BracketPickValue = {
    semifinalists: string[];
    finalists: string[];
    champion: string;
};

function normalizeBracketValue(value: PredictionValue | undefined, fallbackSemifinalists: string[]) {
    const baseSemifinalists = fallbackSemifinalists.slice(0, 4);

    if (value && typeof value === "object" && !Array.isArray(value)) {
        const semifinalists = Array.isArray(value.semifinalists)
            ? value.semifinalists.filter((item): item is string => typeof item === "string").slice(0, 4)
            : baseSemifinalists;
        const finalists = Array.isArray(value.finalists)
            ? value.finalists.filter((item): item is string => typeof item === "string").slice(0, 2)
            : [];
        const champion = typeof value.champion === "string" ? value.champion : "";

        return {
            semifinalists: semifinalists.length === 4 ? semifinalists : baseSemifinalists,
            finalists,
            champion,
        };
    }

    return {
        semifinalists: baseSemifinalists,
        finalists: [],
        champion: "",
    };
}

function buildBracketValue(value: BracketPickValue): PredictionValue {
    return {
        semifinalists: value.semifinalists,
        finalists: value.finalists,
        champion: value.champion,
    };
}

function BracketMatch({
    label,
    home,
    away,
    selectedWinner,
    onPick,
    disabled,
}: {
    label: string;
    home: string | null;
    away: string | null;
    selectedWinner: string;
    onPick: (teamCode: string) => void;
    disabled?: boolean;
}) {
    const { t } = useTranslation("bolao");
    const options = [home, away].filter((item): item is string => Boolean(item));

    return (
        <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{label}</p>
            <div className="mt-3 grid gap-2">
                {options.map((teamCode) => {
                    const isSelected = selectedWinner === teamCode;
                    return (
                        <button
                            key={`${label}_${teamCode}`}
                            type="button"
                            onClick={() => onPick(teamCode)}
                            disabled={disabled}
                            className={cn(
                                "flex items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                                isSelected
                                    ? "border-primary bg-primary/10 text-white"
                                    : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                            )}
                        >
                            <Flag code={teamCode} size="sm" />
                            <span className="text-sm font-black">{teamCode}</span>
                        </button>
                    );
                })}
                {options.length === 0 && (
                    <div className="rounded-[18px] border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-500">
                        {t("bracket_pick.waiting_classifieds")}
                    </div>
                )}
            </div>
        </div>
    );
}

export function BracketPickCard({
    semifinalists,
    savedValue,
    resolvedValue,
    canManage,
    saving,
    resolving,
    onSave,
    onResolve,
}: {
    semifinalists: string[];
    savedValue?: PredictionValue;
    resolvedValue?: PredictionValue;
    canManage?: boolean;
    saving?: boolean;
    resolving?: boolean;
    onSave: (value: PredictionValue) => Promise<void>;
    onResolve?: (value: PredictionValue) => Promise<void>;
}) {
    const { t } = useTranslation('bolao');
    const [draft, setDraft] = useState<BracketPickValue>(() => normalizeBracketValue(savedValue, semifinalists));
    const [resolutionDraft, setResolutionDraft] = useState<BracketPickValue>(() => normalizeBracketValue(resolvedValue, semifinalists));

    useEffect(() => {
        setDraft(normalizeBracketValue(savedValue, semifinalists));
    }, [savedValue, semifinalists]);

    useEffect(() => {
        setResolutionDraft(normalizeBracketValue(resolvedValue, semifinalists));
    }, [resolvedValue, semifinalists]);

    const hasSemifinalists = semifinalists.length === 4;

    const draftFinalists = useMemo(() => draft.finalists.filter(Boolean).slice(0, 2), [draft.finalists]);
    const resolutionFinalists = useMemo(() => resolutionDraft.finalists.filter(Boolean).slice(0, 2), [resolutionDraft.finalists]);

    const updateWinner = (
        current: BracketPickValue,
        setter: React.Dispatch<React.SetStateAction<BracketPickValue>>,
        index: 0 | 1,
        winner: string
    ) => {
        const nextFinalists = [...current.finalists];
        nextFinalists[index] = winner;
        const nextChampion = nextFinalists.includes(current.champion) ? current.champion : "";
        setter({
            ...current,
            finalists: nextFinalists.slice(0, 2),
            champion: nextChampion,
        });
    };

    const updateChampion = (
        current: BracketPickValue,
        setter: React.Dispatch<React.SetStateAction<BracketPickValue>>,
        champion: string
    ) => {
        setter({
            ...current,
            champion,
        });
    };

    if (!hasSemifinalists) {
        return (
            <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <GitBranch className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-white">{t('bracket_pick.unlocks_with')}</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                            {t("bracket_pick.unlocks_desc")}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{t('bracket_pick.your_bracket')}</p>
                <p className="mt-2 text-sm text-zinc-400">
                    {t("bracket_pick.your_bracket_desc")}
                </p>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                    <div className="space-y-4">
                        <BracketMatch
                            label={t("bracket_pick.semifinal_label", { number: 1 })}
                            home={draft.semifinalists[0] ?? null}
                            away={draft.semifinalists[1] ?? null}
                            selectedWinner={draftFinalists[0] ?? ""}
                            onPick={(winner) => updateWinner(draft, setDraft, 0, winner)}
                        />
                        <BracketMatch
                            label={t("bracket_pick.semifinal_label", { number: 2 })}
                            home={draft.semifinalists[2] ?? null}
                            away={draft.semifinalists[3] ?? null}
                            selectedWinner={draftFinalists[1] ?? ""}
                            onPick={(winner) => updateWinner(draft, setDraft, 1, winner)}
                        />
                    </div>

                    <div className="hidden items-center justify-center lg:flex">
                        <div className="h-full w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
                    </div>

                    <div className="rounded-[22px] border border-primary/15 bg-primary/5 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{t('bracket_pick.final')}</p>
                        <div className="mt-3 grid gap-2">
                            {draftFinalists.length === 2 ? (
                                draftFinalists.map((teamCode) => {
                                    const isSelected = draft.champion === teamCode;
                                    return (
                                        <button
                                            key={`final_${teamCode}`}
                                            type="button"
                                            onClick={() => updateChampion(draft, setDraft, teamCode)}
                                            className={cn(
                                                "flex items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary/15 text-white"
                                                    : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                                            )}
                                        >
                                            <Flag code={teamCode} size="sm" />
                                            <span className="text-sm font-black">{teamCode}</span>
                                            {isSelected && <Trophy className="ml-auto h-4 w-4 text-primary" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="rounded-[18px] border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-500">
                                    {t("bracket_pick.final_locked_desc")}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => void onSave(buildBracketValue(draft))}
                            disabled={!draft.champion || saving}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : draft.champion ? <CheckCircle2 className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                            {saving ? t('bracket_pick.saving') : t('bracket_pick.save')}
                        </button>
                    </div>
                </div>
            </div>

            {savedValue && (
                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{t('bracket_pick.saved_bracket')}</p>
                    <p className="mt-2 text-sm text-zinc-300">
                        {t('bracket_pick.finalists')}: <span className="font-black text-white">{draftFinalists.join(" x ") || t('bracket_pick.not_defined_yet')}</span>
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                        {t('bracket_pick.champion')}: <span className="font-black text-white">{draft.champion || t('bracket_pick.champion_not_defined')}</span>
                    </p>
                </div>
            )}

            {canManage && onResolve && (
                <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">{t('bracket_pick.official_result')}</p>
                    <p className="mt-2 text-sm text-zinc-400">
                        {t("bracket_pick.official_result_desc")}
                    </p>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                        <div className="space-y-4">
                            <BracketMatch
                                label={t("bracket_pick.semifinal_label", { number: 1 })}
                                home={resolutionDraft.semifinalists[0] ?? null}
                                away={resolutionDraft.semifinalists[1] ?? null}
                                selectedWinner={resolutionFinalists[0] ?? ""}
                                onPick={(winner) => updateWinner(resolutionDraft, setResolutionDraft, 0, winner)}
                            />
                            <BracketMatch
                                label={t("bracket_pick.semifinal_label", { number: 2 })}
                                home={resolutionDraft.semifinalists[2] ?? null}
                                away={resolutionDraft.semifinalists[3] ?? null}
                                selectedWinner={resolutionFinalists[1] ?? ""}
                                onPick={(winner) => updateWinner(resolutionDraft, setResolutionDraft, 1, winner)}
                            />
                        </div>

                        <div className="hidden items-center justify-center lg:flex">
                            <div className="h-full w-px bg-gradient-to-b from-transparent via-amber-400/20 to-transparent" />
                        </div>

                        <div className="rounded-[22px] border border-amber-500/20 bg-black/10 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">{t('bracket_pick.official_final')}</p>
                            <div className="mt-3 grid gap-2">
                                {resolutionFinalists.length === 2 ? (
                                    resolutionFinalists.map((teamCode) => {
                                        const isSelected = resolutionDraft.champion === teamCode;
                                        return (
                                            <button
                                                key={`resolution_final_${teamCode}`}
                                                type="button"
                                                onClick={() => updateChampion(resolutionDraft, setResolutionDraft, teamCode)}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all",
                                                    isSelected
                                                        ? "border-amber-400 bg-amber-500/15 text-white"
                                                        : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                                                )}
                                            >
                                                <Flag code={teamCode} size="sm" />
                                                <span className="text-sm font-black">{teamCode}</span>
                                                {isSelected && <Trophy className="ml-auto h-4 w-4 text-amber-300" />}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-[18px] border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-500">
                                        {t("bracket_pick.official_final_locked_desc")}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => void onResolve(buildBracketValue(resolutionDraft))}
                                disabled={!resolutionDraft.champion || resolving}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                            >
                                {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                                {resolving ? t('bracket_pick.resolving') : t('bracket_pick.confirm_official')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
