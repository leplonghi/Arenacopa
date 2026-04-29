import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  alterBolaoPresentation,
  createDraftBolao,
  deleteBolao,
  publishBolao,
  removePoolMember,
  submitPoolMemberPaymentProof,
  updateBolaoConfiguration,
} from "@/services/boloes/bolao-config.service";
import { listUserBoloes } from "@/services/boloes/bolao-listing.service";

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

  it("calls the delete endpoint and returns a deleted state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bolao_id: "bolao-1",
          lifecycle: { status: "deleted" },
          integrity: { is_structure_locked: true, config_version: 3 },
          editable_sections: { presentation: false, operation: false },
        }),
      })),
    );

    const response = await deleteBolao({
      token: "token-1",
      payload: {
        bolao_id: "bolao-1",
        reason: "owner_deleted_from_edit_panel",
      },
    });

    expect(response.lifecycle.status).toBe("deleted");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("deleteBolao"),
      expect.objectContaining({
        body: JSON.stringify({
          bolao_id: "bolao-1",
          reason: "owner_deleted_from_edit_panel",
        }),
      }),
    );
  });

  it("calls the payment proof endpoint and returns raw operation result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          member_id: "user-1_bolao-1",
          payment_proof_status: "submitted",
          prize_agreement_status: "submitted",
        }),
      })),
    );

    const response = await submitPoolMemberPaymentProof({
      token: "token-1",
      payload: {
        bolao_id: "bolao-1",
        proof_text: "Pix enviado pelo Banco X",
        prize_agreement_accepted: true,
      },
    });

    expect(response.payment_proof_status).toBe("submitted");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("submitPoolMemberPaymentProof"),
      expect.objectContaining({
        body: JSON.stringify({
          bolao_id: "bolao-1",
          proof_text: "Pix enviado pelo Banco X",
          prize_agreement_accepted: true,
        }),
      }),
    );
  });

  it("calls the backend listing endpoint for bolao cards", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          myBoloes: [{ id: "bolao-1", name: "Arena", category: "private" }],
          pendingRequests: [],
          discoverBoloes: [],
        }),
      })),
    );

    const response = await listUserBoloes({ token: "token-1" });

    expect(response.myBoloes[0].id).toBe("bolao-1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("listUserBoloes"),
      expect.objectContaining({
        body: JSON.stringify({}),
      }),
    );
  });
});
