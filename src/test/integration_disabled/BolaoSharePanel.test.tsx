import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BolaoSharePanel } from "@/components/copa/bolao/BolaoSharePanel";

describe("BolaoSharePanel", () => {
  it("renders invite code, share actions and direct link", () => {
    render(
      <BolaoSharePanel
        bolaoName="Bolão da Firma"
        inviteCode="ABC123"
        inviteUrl="https://arena.test/b/ABC123"
        shareText="Convite pronto"
        onNativeShare={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /Convide sua turma para Bolão da Firma/i })).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Compartilhar agora/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar texto para WhatsApp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar link direto/i })).toBeInTheDocument();
    expect(screen.getByText("https://arena.test/b/ABC123")).toBeInTheDocument();
  });
});
