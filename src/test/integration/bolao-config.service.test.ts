import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  alterBolaoPresentation,
  createDraftBolao,
  publishBolao,
  removePoolMember,
  updateBolaoConfiguration,
} from "@/services/boloes/bolao-config.service";

vi.mock("@/integrations/firebase/client", () => ({
  auth: {
    currentUser: null,
  },
}));

describe("bolao-config.service", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bolao_id: "bolao-1",
          lifecycle: { status: "draft" },
          integrity: { is_structure_locked: false, config_version: 1 },
          editable_sections: { presentation: true, competition_rules: true },
        }),
      })),
    );
  });

  it("calls the draft endpoint and returns a normalized response", async () => {
    const response = await createDraftBolao({
      token: "token-1",
      payload: { context: { group_binding_mode: "none" } },
    });

    expect(response.bolaoId).toBe("bolao-1");
    expect(response.lifecycle.status).toBe("draft");
    expect(response.editableSections.competition_rules).toBe(true);
  });

  it("calls the configuration endpoint and normalizes the response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bolao_id: "bolao-1",
          lifecycle: { status: "draft" },
          integrity: { is_structure_locked: false, config_version: 2 },
          editable_sections: { presentation: true, competition_rules: true },
        }),
      })),
    );

    const response = await updateBolaoConfiguration({
      token: "token-1",
      payload: {
        bolao_id: "bolao-1",
        expected_config_version: 1,
        patch: {
          competition_rules: { format: "detailed" },
        },
      },
    });

    expect(response.integrity.configVersion).toBe(2);
  });

  it("calls the publish endpoint and returns a published state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bolao_id: "bolao-1",
          lifecycle: { status: "published" },
          integrity: { is_structure_locked: false, config_version: 2 },
          editable_sections: { presentation: true, competition_rules: false },
        }),
      })),
    );

    const response = await publishBolao({
      token: "token-1",
      payload: {
        bolao_id: "bolao-1",
        expected_config_version: 1,
      },
    });

    expect(response.lifecycle.status).toBe("published");
    expect(response.editableSections.competition_rules).toBe(false);
  });

  it("calls the presentation endpoint and preserves normalized shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bolao_id: "bolao-1",
          lifecycle: { status: "published" },
          integrity: { is_structure_locked: false, config_version: 2 },
          editable_sections: { presentation: true, competition_rules: false },
        }),
      })),
    );

    const response = await alterBolaoPresentation({
      token: "token-1",
      payload: {
        bolao_id: "bolao-1",
        patch: {
          description: "Nova descrição",
        },
      },
    });

    expect(response.bolaoId).toBe("bolao-1");
    expect(response.lifecycle.status).toBe("published");
  });

  it("calls member removal endpoint and returns raw operation result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          member_id: "member-1",
          membership_status: "withdrawn_by_owner",
          removal_reason_code: "owner_cleanup",
        }),
      })),
    );

    const response = await removePoolMember({
      token: "token-1",
      payload: {
        bolao_id: "bolao-1",
        member_id: "member-1",
        reason_code: "owner_cleanup",
      },
    });

    expect(response.member_id).toBe("member-1");
    expect(response.membership_status).toBe("withdrawn_by_owner");
  });
});
