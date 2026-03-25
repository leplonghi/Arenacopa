import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingModal } from "@/components/OnboardingModal";

const useAuthMock = vi.fn();
const updateFavoriteTeamMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/services/profile/profile.service", () => ({
  updateFavoriteTeam: (...args: unknown[]) => updateFavoriteTeamMock(...args),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

describe("OnboardingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthMock.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
    });
    updateFavoriteTeamMock.mockResolvedValue(undefined);
  });

  it("abre para usuario autenticado sem onboarding concluido e salva o time favorito", async () => {
    render(<OnboardingModal />);

    expect(await screen.findByText("onboarding.title")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /próximo/i }));

    await waitFor(() => {
      expect(updateFavoriteTeamMock).toHaveBeenCalledWith("user-1", "BRA");
    });

    expect(localStorage.getItem("favorite_team")).toBe("BRA");
    expect(localStorage.getItem("arenacopa_onboarding_migrated")).toBe("true");
  });

  it("nao abre em modo demo", () => {
    localStorage.setItem("demo_mode", "true");

    render(<OnboardingModal />);

    expect(screen.queryByText("onboarding.title")).not.toBeInTheDocument();
  });
});
