import { useEffect, useRef, useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CreateBolaoCatalogStep } from "@/features/boloes/create/CreateBolaoCatalogStep";
import { CreateBolaoContextStep } from "@/features/boloes/create/CreateBolaoContextStep";
import { CreateBolaoRulesStep } from "@/features/boloes/create/CreateBolaoRulesStep";
import { CreateBolaoAdmissionStep } from "@/features/boloes/create/CreateBolaoAdmissionStep";
import { CreateBolaoQuickStep } from "@/features/boloes/create/CreateBolaoQuickStep";
import { CreateBolaoReviewStep } from "@/features/boloes/create/CreateBolaoReviewStep";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";

const STEPS_ORDER = ["quick", "catalog", "context", "type", "admission", "review"];

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

  return (
    <div className="flex flex-col min-h-screen">
      <CreateBolaoStepRail 
        activeStep={activeStepIndex} 
        onStepClick={(index) => flow.setStep(STEPS_ORDER[index - 1] as StepsOrderType)} 
      />
      
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
