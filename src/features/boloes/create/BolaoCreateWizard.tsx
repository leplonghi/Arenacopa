import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CreateBolaoCatalogStep } from "@/features/boloes/create/CreateBolaoCatalogStep";
import { CreateBolaoContextStep } from "@/features/boloes/create/CreateBolaoContextStep";
import { CreateBolaoRulesStep } from "@/features/boloes/create/CreateBolaoRulesStep";
import { CreateBolaoAdmissionStep } from "@/features/boloes/create/CreateBolaoAdmissionStep";
import { CreateBolaoQuickStep } from "@/features/boloes/create/CreateBolaoQuickStep";
import { CreateBolaoReviewStep } from "@/features/boloes/create/CreateBolaoReviewStep";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";

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

  useEffect(() => () => {
    if (!completedRef.current) {
      trackSocialEvent("step_abandoned", {
        flow: "bolao_create",
        step: stepRef.current,
      });
    }
  }, []);

  if (flow.step === "quick") {
    return <CreateBolaoQuickStep flow={flow} />;
  }

  if (flow.step === "catalog") {
    return <CreateBolaoCatalogStep flow={flow} />;
  }

  if (flow.step === "context") {
    return <CreateBolaoContextStep flow={flow} />;
  }

  if (flow.step === "type") {
    return <CreateBolaoRulesStep flow={flow} />;
  }

  if (flow.step === "admission") {
    return <CreateBolaoAdmissionStep flow={flow} />;
  }

  return <CreateBolaoReviewStep flow={flow} />;
}
