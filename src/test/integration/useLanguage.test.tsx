import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLanguage } from "@/i18n/useLanguage";

const useAuthMock = vi.fn();
const changeLanguageMock = vi.fn();
const getProfileMock = vi.fn();
const updatePreferredLanguageMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "pt-BR",
      changeLanguage: changeLanguageMock,
    },
  }),
}));

vi.mock("@/services/profile/profile.service", () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
  updatePreferredLanguage: (...args: unknown[]) => updatePreferredLanguageMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

function Harness() {
  const { language, changeLanguage, isLoading } = useLanguage();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <button onClick={() => void changeLanguage("en")}>change</button>
    </div>
  );
}

describe("useLanguage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getProfileMock.mockResolvedValue(null);
    updatePreferredLanguageMock.mockResolvedValue(undefined);
    changeLanguageMock.mockResolvedValue(undefined);
  });

  it("troca idioma em demo sem tentar persistir no Firestore", async () => {
    localStorage.setItem("demo_mode", "true");
    useAuthMock.mockReturnValue({
      user: {
        id: "demo-user-id",
        email: "demo@arenacopa.com",
      },
    });

    render(<Harness />);

    fireEvent.click(screen.getByText("change"));

    await waitFor(() => {
      expect(changeLanguageMock).toHaveBeenCalledWith("en");
    });

    expect(updatePreferredLanguageMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("i18nextLng")).toBe("en");
    expect(toastSuccessMock).toHaveBeenCalled();
  });
});
