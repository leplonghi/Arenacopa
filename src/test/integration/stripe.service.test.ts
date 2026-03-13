import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePremiumSimulation,
  createStripeCheckoutSession,
  getPremiumStatus,
  syncStripeCheckoutSession,
} from "@/services/monetization/stripe.service";

const supabaseMocks = vi.hoisted(() => {
  const maybeSingleMock = vi.fn();
  const limitMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
  const orderMock = vi.fn(() => ({ limit: limitMock }));
  const eqMock = vi.fn(() => ({ order: orderMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));
  const invokeMock = vi.fn();

  return {
    maybeSingleMock,
    fromMock,
    invokeMock,
  };
});

vi.mock("@/services/supabase/client", () => ({
  supabase: {
    from: supabaseMocks.fromMock,
    functions: {
      invoke: supabaseMocks.invokeMock,
    },
  },
}));

describe("stripe monetization service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("retorna estado inativo quando nao existe assinatura", async () => {
    supabaseMocks.maybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
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

  it("cria checkout session via edge function", async () => {
    supabaseMocks.invokeMock.mockResolvedValue({
      data: {
        url: "https://checkout.stripe.com/pay/cs_test",
        sessionId: "cs_test",
      },
      error: null,
    });

    const result = await createStripeCheckoutSession();

    expect(supabaseMocks.invokeMock).toHaveBeenCalledWith("create-stripe-checkout", { body: {} });
    expect(result.url).toContain("checkout.stripe.com");
    expect(result.sessionId).toBe("cs_test");
  });

  it("sincroniza o retorno do checkout", async () => {
    supabaseMocks.invokeMock.mockResolvedValue({
      data: {
        isPremium: true,
        status: "active",
      },
      error: null,
    });

    const result = await syncStripeCheckoutSession("cs_sync");

    expect(supabaseMocks.invokeMock).toHaveBeenCalledWith("sync-stripe-checkout", {
      body: {
        checkoutSessionId: "cs_sync",
      },
    });
    expect(result.isPremium).toBe(true);
    expect(result.status).toBe("active");
  });

  it("ativa o premium simulado em desenvolvimento", () => {
    const result = activatePremiumSimulation();

    expect(result.isPremium).toBe(true);
    expect(localStorage.getItem("isPremium")).toBe("true");
  });
});
