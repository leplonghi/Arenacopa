import { useSearchParams } from "react-router-dom";
import { CreateBolaoContextStep } from "@/features/boloes/create/CreateBolaoContextStep";
import { CreateBolaoRulesStep } from "@/features/boloes/create/CreateBolaoRulesStep";
import { CreateBolaoReviewStep } from "@/features/boloes/create/CreateBolaoReviewStep";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

export function BolaoCreateWizard() {
  const [searchParams] = useSearchParams();
  const flow = useBolaoCreateFlow(searchParams.get("grupoId"));

  if (flow.step === "context") {
    return <CreateBolaoContextStep flow={flow} />;
  }

  if (flow.step === "rules") {
    return <CreateBolaoRulesStep flow={flow} />;
  }

  return <CreateBolaoReviewStep flow={flow} />;
}
