import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CreateBolaoContextStep } from "@/features/boloes/create/CreateBolaoContextStep";
import { CreateBolaoRulesStep } from "@/features/boloes/create/CreateBolaoRulesStep";
import { CreateBolaoAdmissionStep } from "@/features/boloes/create/CreateBolaoAdmissionStep";
import { CreateBolaoReviewStep } from "@/features/boloes/create/CreateBolaoReviewStep";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";

export function BolaoCreateWizard() {
  const [searchParams] = useSearchParams();
  const flow = useBolaoCreateFlow(searchParams.get("grupoId"));
  const completedRef = useRef(false);
  const stepRef = useRef(flow.step);

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
