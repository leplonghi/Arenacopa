import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLanguage } from "@/i18n/useLanguage";

const changeLanguageMock = vi.fn();

const i18nMock = {
  language: "pt-BR",
  resolvedLanguage: "pt-BR",
  changeLanguage: changeLanguageMock,
};

const RealDateTimeFormat = Intl.DateTimeFormat;

function mockTimeZone(timeZone: string) {
  Intl.DateTimeFormat = vi.fn(((...args: ConstructorParameters<typeof Intl.DateTimeFormat>) => {
    if (args.length === 0) {
      return {
        resolvedOptions: () => ({ timeZone }),
      } as Intl.DateTimeFormat;
    }

    return new RealDateTimeFormat(...args);
  }) as unknown as typeof Intl.DateTimeFormat);
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: i18nMock,
  }),
}));

function Harness() {
  const { language, systemLanguage, isSystemLanguage, isLoading } = useLanguage();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="system-language">{systemLanguage}</span>
      <span data-testid="system-match">{String(isSystemLanguage)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
}

describe("useLanguage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimeZone("UTC");
    i18nMock.language = "pt-BR";
    i18nMock.resolvedLanguage = "pt-BR";
    changeLanguageMock.mockImplementation(async (language: string) => {
      i18nMock.language = language;
      i18nMock.resolvedLanguage = language;
    });

    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "es-MX",
    });

    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["es-MX", "en-US"],
    });
  });

  afterEach(() => {
    Intl.DateTimeFormat = RealDateTimeFormat;
  });

  it("sincroniza o idioma do app com o idioma do sistema", async () => {
    const { rerender } = render(<Harness />);

    await waitFor(() => {
      expect(changeLanguageMock).toHaveBeenCalledWith("es");
    });

    rerender(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("language").textContent).toBe("es");
      expect(screen.getByTestId("system-language").textContent).toBe("es");
      expect(screen.getByTestId("system-match").textContent).toBe("true");
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("mantem o idioma quando o app ja esta alinhado com o sistema", async () => {
    i18nMock.language = "en";
    i18nMock.resolvedLanguage = "en";

    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US",
    });

    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["en-US", "es-MX"],
    });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("language").textContent).toBe("en");
      expect(screen.getByTestId("system-language").textContent).toBe("en");
      expect(screen.getByTestId("system-match").textContent).toBe("true");
    });

    expect(changeLanguageMock).not.toHaveBeenCalled();
  });

  it("prioriza pt-BR quando o aparelho esta em um fuso horario do Brasil", async () => {
    i18nMock.language = "en";
    i18nMock.resolvedLanguage = "en";

    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US",
    });

    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["en-US"],
    });

    mockTimeZone("America/Fortaleza");

    const { rerender } = render(<Harness />);

    await waitFor(() => {
      expect(changeLanguageMock).toHaveBeenCalledWith("pt-BR");
    });

    rerender(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("language").textContent).toBe("pt-BR");
      expect(screen.getByTestId("system-language").textContent).toBe("pt-BR");
    });
  });
});
