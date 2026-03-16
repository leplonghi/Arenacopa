import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Auth from "@/pages/Auth";

const toastMock = vi.fn();
const signInWithGoogleMock = vi.fn();
const ensureProfileMock = vi.fn();
const updateProfileMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: (...args: unknown[]) => toastMock(...args),
  }),
}));

vi.mock("@/services/auth/auth.service", () => ({
  signInWithGoogle: (...args: unknown[]) => signInWithGoogleMock(...args),
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
}));

vi.mock("@/services/profile/profile.service", () => ({
  acceptTerms: vi.fn(),
  ensureProfile: (...args: unknown[]) => ensureProfileMock(...args),
  updateProfile: (...args: unknown[]) => updateProfileMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("Auth Google flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthMock.mockReturnValue({
      loginAsDemo: vi.fn(),
    });
    signInWithGoogleMock.mockResolvedValue({
      uid: "google-user",
      email: "google@example.com",
      displayName: "Google User",
      photoURL: "https://example.com/avatar.png",
    });
    ensureProfileMock.mockResolvedValue(undefined);
    updateProfileMock.mockResolvedValue(undefined);
  });

  it("completa o fluxo do Google criando perfil e redirecionando", async () => {
    render(
      <MemoryRouter initialEntries={["/auth?redirect=/perfil"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/perfil" element={<div>Perfil aberto</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "login.google" }));

    await waitFor(() => {
      expect(signInWithGoogleMock).toHaveBeenCalled();
      expect(ensureProfileMock).toHaveBeenCalledWith({
        id: "google-user",
        email: "google@example.com",
        user_metadata: {
          full_name: "Google User",
          name: "Google User",
          avatar_url: "https://example.com/avatar.png",
        },
      });
      expect(updateProfileMock).toHaveBeenCalledWith("google-user", {
        name: "Google User",
      });
      expect(screen.getByText("Perfil aberto")).toBeInTheDocument();
    });
  });
});
