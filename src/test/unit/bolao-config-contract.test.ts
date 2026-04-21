import { describe, expect, it } from "vitest";
import { mapBolaoConfigDocument } from "@/services/boloes/bolao-config.mapper";

describe("mapBolaoConfigDocument", () => {
  it("normalizes lifecycle, integrity, and editable sections for legacy-safe reads", () => {
    const mapped = mapBolaoConfigDocument({
      id: "bolao-1",
      name: "Arena",
      lifecycle: { status: "published" },
      integrity: { is_structure_locked: true, config_version: 4 },
      editable_sections: { presentation: true, competition_rules: false },
    });

    expect(mapped.lifecycle.status).toBe("published");
    expect(mapped.integrity.configVersion).toBe(4);
    expect(mapped.editableSections.presentation).toBe(true);
  });
});
