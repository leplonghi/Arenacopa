import { describe, expect, it } from "vitest";
import { commercialCampaignAudienceCopy } from "@/lib/commercial-campaign-copy";

describe("commercial campaign copy", () => {
  it("positions campaigns for businesses and events, not only bars", () => {
    expect(commercialCampaignAudienceCopy.eyebrow).toBe("ArenaCup para negócios");
    expect(commercialCampaignAudienceCopy.title).toBe("ArenaCup para Negócios");
    expect(commercialCampaignAudienceCopy.description).toContain("empresas");
    expect(commercialCampaignAudienceCopy.description).toContain("eventos");
    expect(commercialCampaignAudienceCopy.description).toContain("campanhas prontas");
  });
});
