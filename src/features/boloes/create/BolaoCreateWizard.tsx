import { useEffect, useRef, useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Zap } from "lucide-react";
import { CreateBolaoCatalogStep } from "@/features/boloes/create/CreateBolaoCatalogStep";
import { CreateBolaoContextStep } from "@/features/boloes/create/CreateBolaoContextStep";
import { CreateBolaoRulesStep } from "@/features/boloes/create/CreateBolaoRulesStep";
import { CreateBolaoAdmissionStep } from "@/features/boloes/create/CreateBolaoAdmissionStep";
import { CreateBolaoQuickStep } from "@/features/boloes/create/CreateBolaoQuickStep";
import { CreateBolaoReviewStep } from "@/features/boloes/create/CreateBolaoReviewStep";
import { useBolaoCreateFlow, type CreateStep } from "@/features/boloes/create/useBolaoCreateFlow";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";

const STEPS_ORDER: CreateStep[] = ["quick", "catalog", "context", "type", "admission", "review"];

export function BolaoCreateWizard() {
  const [searchParams] = useSearchParams();
  const grupoId = searchParams.get("grupoId");
  const flow = useBolaoCreateFlow(grupoId);
  const completedRef = useRef(false);
  const stepRef = useRef(flow.step);

  useEffect(() => {
    // If entering via a group link, skip mode selection → go straight to quick
    if (grupoId && flow.step === "mode") {
      flow.setStep("quick");
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    completedRef.current = Boolean(flow.draftId);
  }, [flow.draftId]);

  useEffect(() => {
    stepRef.current = flow.step;
  }, [flow.step]);

  // Always scroll to top when step changes
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [flow.step]);

  useEffect(() => () => {
    if (!completedRef.current) {
      trackSocialEvent("step_abandoned", {
        flow: "bolao_create",
        step: stepRef.current,
      });
    }
  }, []);

  const activeStepIndex = STEPS_ORDER.indexOf(flow.step) + 1;

  // Express path: once the essentials (name + championship + matches) are set,
  // the remaining steps (context/type/admission) only confirm safe defaults —
  // so offer a one-tap jump straight to review. Hidden on quick/review steps.
  const matchesPicked =
    flow.state.allowedMatchIds === "all" ||
    (Array.isArray(flow.state.allowedMatchIds) && flow.state.allowedMatchIds.length > 0);
  const canQuickCreate =
    flow.state.name.trim().length >= 3 &&
    Boolean(flow.state.championshipId) &&
    matchesPicked;
  const showQuickCreate = canQuickCreate && flow.step !== "review" && flow.step !== "quick";

  return (
    <div className="flex flex-col min-h-screen">
      <CreateBolaoStepRail
        activeStep={activeStepIndex}
        onStepClick={(index) => flow.setStep(STEPS_ORDER[index - 1])}
      />

      {showQuickCreate && (
        <div className="sticky top-[52px] z-[95] flex justify-end border-b border-white/5 bg-[#09090b]/80 px-4 py-2 backdrop-blur-xl md:top-[124px] md:px-8">
          <button
            type="button"
            onClick={() => {
              trackSocialEvent("pool_create_express", { from_step: flow.step });
              flow.setStep("review");
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary transition hover:bg-primary/20 active:scale-95"
          >
            <Zap className="h-3.5 w-3.5" />
            Criar agora
          </button>
        </div>
      )}

      <div className="flex-1 px-4 pb-6 pt-0 md:px-8">
        {flow.step === "quick" && <CreateBolaoQuickStep flow={flow} />}
        {flow.step === "catalog" && <CreateBolaoCatalogStep flow={flow} />}
        {flow.step === "context" && <CreateBolaoContextStep flow={flow} />}
        {flow.step === "type" && <CreateBolaoRulesStep flow={flow} />}
        {flow.step === "admission" && <CreateBolaoAdmissionStep flow={flow} />}
        {flow.step === "review" && <CreateBolaoReviewStep flow={flow} />}
      </div>
    </div>
  );
}
