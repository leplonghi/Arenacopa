import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGroup,
  joinViaInvite,
  requestBolaoJoin,
  requestGroupJoin,
  updateGroupSettings,
} from "@/services/groups/group-access.service";

vi.mock("@/integrations/firebase/client", () => ({
  auth: {
    currentUser: null,
  },
}));

describe("group-access.service", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          group_id: "grupo-1",
          id: "grupo-1",
          name: "Injeção",
          description: "Galera da copa",
          emoji: "👥",
          visibility: "private",
          admission_mode: "approval",
          category: "private",
          featured_bolao_id: null,
          objective: "friends",
          invite_code: "GRP12345",
        }),
      })),
    );
  });

  it("creates a group and normalizes the response", async () => {
    const response = await createGroup({
      token: "token-1",
      payload: {
        presentation: { name: "Injeção" },
        visibility: "private",
        admission_mode: "approval",
      },
    });

    expect(response.id).toBe("grupo-1");
    expect(response.inviteCode).toBe("GRP12345");
    expect(response.admissionMode).toBe("approval");
  });

  it("updates group settings and keeps normalized shape", async () => {
    const response = await updateGroupSettings({
      token: "token-1",
      payload: {
        group_id: "grupo-1",
        patch: {
          featured_bolao_id: "bolao-1",
        },
      },
    });

    expect(response.id).toBe("grupo-1");
    expect(response.featuredBolaoId).toBeNull();
  });

  it("requests group join and returns operation metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          group_id: "grupo-1",
          status: "requested",
          request_id: "grupo-1_user-1",
          request_status: "pending",
          group: {
            id: "grupo-1",
            name: "Injeção",
            emoji: "👥",
            category: "private",
            invite_code: "GRP12345",
          },
        }),
      })),
    );

    const response = await requestGroupJoin({
      token: "token-1",
      payload: {
        group_id: "grupo-1",
      },
    });

    expect(response.status).toBe("requested");
    expect(response.requestId).toBe("grupo-1_user-1");
  });

  it("requests pool join and exposes required group when needed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bolao_id: "bolao-1",
          status: "requested",
          request_id: "bolao-1_user-1",
          request_status: "pending",
          required_group_id: "grupo-1",
        }),
      })),
    );

    const response = await requestBolaoJoin({
      token: "token-1",
      payload: {
        bolao_id: "bolao-1",
      },
    });

    expect(response.bolaoId).toBe("bolao-1");
    expect(response.requiredGroupId).toBe("grupo-1");
  });

  it("joins via invite through the shared endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          group_id: "grupo-1",
          status: "joined",
        }),
      })),
    );

    const response = await joinViaInvite({
      token: "token-1",
      payload: {
        kind: "group",
        invite_code: "GRP12345",
      },
    });

    expect(response.status).toBe("joined");
    expect(response.group_id).toBe("grupo-1");
  });
});
