import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePremiumSimulation,
  createStripeCheckoutSession,
  getPremiumStatus,
  PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE,
  syncStripeCheckoutSession,
} from "@/services/monetization/stripe.service";

const firestoreMocks = vi.hoisted(() => {
  const getDocsMock = vi.fn();
  const limitMock = vi.fn();
  const orderByMock = vi.fn();
  const whereMock = vi.fn();
  const queryMock = vi.fn(() => "query-ref");
  const collectionMock = vi.fn(() => "collection-ref");

  return {
    collectionMock,
    getDocsMock,
    limitMock,
    orderByMock,
    queryMock,
    whereMock,
  };
});

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: firestoreMocks.collectionMock,
  getDocs: firestoreMocks.getDocsMock,
  limit: firestoreMocks.limitMock,
  orderBy: firestoreMocks.orderByMock,
  query: firestoreMocks.queryMock,
  where: firestoreMocks.whereMock,
}));

describe("stripe monetization service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("retorna estado inativo quando nao existe assinatura", async () => {
    firestoreMocks.getDocsMock.mockResolvedValue({
      empty: true,
      docs: [],
    });

    const result = await getPremiumStatus("user-1");

    expect(result).toEqual({
      isPremium: false,
      status: "inactive",
      checkoutSessionId: null,
      amountTotal: null,
      currency: null,
    });
  });

  it("explicita que o checkout esta indisponivel nesta versao", async () => {
    await expect(createStripeCheckoutSession()).rejects.toThrow(PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE);
  });

  it("mantem estado inativo quando o sync ainda nao esta disponivel", async () => {
    const result = await syncStripeCheckoutSession("cs_sync");

    expect(result.isPremium).toBe(false);
    expect(result.status).toBe("inactive");
  });

  it("ativa o premium simulado em desenvolvimento", () => {
    const result = activatePremiumSimulation();

    expect(result.isPremium).toBe(true);
    expect(localStorage.getItem("isPremium")).toBe("true");
  });
});
