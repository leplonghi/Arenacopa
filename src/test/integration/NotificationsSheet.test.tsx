import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsSheet } from "@/components/NotificationsSheet";

const useAuthMock = vi.fn();
const listNotificationsMock = vi.fn();
const markNotificationAsReadMock = vi.fn();
const markAllNotificationsAsReadMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/services/notifications/notifications.service", () => ({
  listNotifications: (...args: unknown[]) => listNotificationsMock(...args),
  markNotificationAsRead: (...args: unknown[]) => markNotificationAsReadMock(...args),
  markAllNotificationsAsRead: (...args: unknown[]) => markAllNotificationsAsReadMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/"
            element={
              <NotificationsSheet>
                <button type="button">abrir</button>
              </NotificationsSheet>
            }
          />
          <Route path="/destino" element={<div>Destino</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NotificationsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    useAuthMock.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
    });
    markNotificationAsReadMock.mockResolvedValue(undefined);
    markAllNotificationsAsReadMock.mockResolvedValue(undefined);
  });

  it("mostra erro quando a consulta falha", async () => {
    listNotificationsMock.mockRejectedValue(new Error("network"));

    renderSheet();

    expect(await screen.findByText("notifications.load_error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "common.retry" })).toBeInTheDocument();
  });

  it("marca notificacao como lida e navega ao clicar em um link", async () => {
    listNotificationsMock.mockResolvedValue([
      {
        id: "n-1",
        title: "Novo convite",
        message: "Entre no bolão agora",
        created_at: new Date().toISOString(),
        type: "invite",
        read: false,
        link: "/destino",
      },
    ]);

    renderSheet();

    const card = await screen.findByText("Novo convite");
    fireEvent.click(card);

    await waitFor(() => {
      expect(markNotificationAsReadMock).toHaveBeenCalledWith("n-1", "user-1");
      expect(screen.getByText("Destino")).toBeInTheDocument();
    });
  });
});
