import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Perfil from "@/pages/Perfil";

const useAuthMock = vi.fn();
const getProfileMock = vi.fn();
const useProfileStatsMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/useProfileStats", () => ({
  useProfileStats: (...args: unknown[]) => useProfileStatsMock(...args),
}));

vi.mock("@/services/profile/profile.service", () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
  updateFavoriteTeam: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/i18n/useLanguage", () => ({
  useLanguage: () => ({
    language: "pt-BR",
    systemLanguage: "pt-BR",
  }),
}));

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("@/components/Flag", () => ({
  Flag: ({ code }: { code: string }) => <div>{code}</div>,
}));

function renderPerfil() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Perfil />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthMock.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
      signOut: vi.fn(),
    });

    useProfileStatsMock.mockReturnValue({
      data: {
        points: 12,
        efficiency: 50,
        exactScores: 2,
        titles: 1,
        createdBoloes: 1,
        totalPredictions: 8,
      },
    });

    getProfileMock.mockResolvedValue({
      user_id: "user-1",
      name: "Usuário Teste",
      favorite_team: "BRA",
      avatar_url: null,
      nickname: null,
      nationality: null,
      bio: null,
      birth_date: null,
      gender: null,
      fun_mode: false,
      notifications_goals: false,
      notifications_news: false,
      notifications_match_start: false,
    });
  });

  it("abre a tela de perfil sem quebrar o render", async () => {
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByText("Usuário Teste")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("button", { name: "favorite_team.select_aria" }).length).toBeGreaterThan(0);
  });
});
