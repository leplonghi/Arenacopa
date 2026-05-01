import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MonetizationProvider, useMonetization } from "@/contexts/MonetizationContext";

const useAuthMock = vi.fn();
const createStripeCheckoutSessionMock = vi.fn();
const getPremiumStatusMock = vi.fn();
const redirectToCheckoutMock = vi.fn();
const syncStripeCheckoutSessionMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/services/monetization/stripe.service", () => ({
  activatePremiumSimulation: vi.fn(() => ({
    isPremium: true,
    status: "active",
    checkoutSessionId: "simulation",
    amountTotal: null,
    currency: "brl",
  })),
  createStripeCheckoutSession: (...args: unknown[]) => createStripeCheckoutSessionMock(...args),
  getPremiumStatus: (...args: unknown[]) => getPremiumStatusMock(...args),
  redirectToCheckout: (...args: unknown[]) => redirectToCheckoutMock(...args),
  syncStripeCheckoutSession: (...args: unknown[]) => syncStripeCheckoutSessionMock(...args),
}));

function Harness() {
  const { isPremium, subscriptionStatus, purchasePremium, refreshPremiumStatus } = useMonetization();

  return (
    <div>
      <span data-testid="premium">{String(isPremium)}</span>
      <span data-testid="status">{subscriptionStatus}</span>
      <button onClick={() => void purchasePremium()}>buy</button>
      <button onClick={() => void refreshPremiumStatus("cs_test")}>refresh</button>
    </div>
  );
}

describe("MonetizationContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthMock.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
    });
    getPremiumStatusMock.mockResolvedValue({
      isPremium: false,
      status: "inactive",
      checkoutSessionId: null,
      amountTotal: null,
      currency: null,
    });
    syncStripeCheckoutSessionMock.mockResolvedValue({
      isPremium: true,
      status: "active",
      checkoutSessionId: "cs_test",
      amountTotal: null,
      currency: null,
    });
  });

  it("carrega o status premium do usuario autenticado", async () => {
    getPremiumStatusMock.mockResolvedValueOnce({
      isPremium: true,
      status: "active",
      checkoutSessionId: "cs_active",
      amountTotal: 990,
      currency: "brl",
    });

    render(
      <MonetizationProvider>
        <Harness />
      </MonetizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("premium")).toHaveTextContent("true");
      expect(screen.getByTestId("status")).toHaveTextContent("active");
    });
  });

  it("inicia checkout no Stripe e redireciona o usuario", async () => {
    createStripeCheckoutSessionMock.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test",
      sessionId: "cs_test",
    });

    render(
      <MonetizationProvider>
        <Harness />
      </MonetizationProvider>,
    );

    fireEvent.click(screen.getByText("buy"));

    await waitFor(() => {
      expect(createStripeCheckoutSessionMock).toHaveBeenCalled();
      expect(redirectToCheckoutMock).toHaveBeenCalledWith("https://checkout.stripe.com/pay/cs_test");
    });
  });

  it("sincroniza o retorno do checkout com a assinatura ativa", async () => {
    render(
      <MonetizationProvider>
        <Harness />
      </MonetizationProvider>,
    );

    fireEvent.click(screen.getByText("refresh"));

    await waitFor(() => {
      expect(syncStripeCheckoutSessionMock).toHaveBeenCalledWith("cs_test");
      expect(screen.getByTestId("premium")).toHaveTextContent("true");
      expect(screen.getByTestId("status")).toHaveTextContent("active");
    });
  });
});
