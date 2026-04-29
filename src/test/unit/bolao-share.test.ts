import { describe, expect, it } from "vitest";
import {
  buildBolaoInviteUrl,
  buildBolaoWhatsAppMessage,
  buildQrPosterFileName,
} from "@/utils/bolao-share";

describe("bolao share helpers", () => {
  it("builds a production invite URL with an action hint for direct joining", () => {
    expect(buildBolaoInviteUrl("abc123")).toBe(
      "https://arenacopa.app/b/ABC123?action=join&utm_source=whatsapp&utm_medium=share&utm_campaign=bolao_invite",
    );
  });

  it("builds a didactic WhatsApp invitation with code, link, and short steps", () => {
    const message = buildBolaoWhatsAppMessage({
      name: "Mesa do Bar do Edu",
      inviteCode: "abc123",
      inviteUrl: "https://arenacopa.app/b/ABC123?action=join",
      context: "bar",
    });

    expect(message).toContain("Mesa do Bar do Edu");
    expect(message).toContain("Codigo: ABC123");
    expect(message).toContain("https://arenacopa.app/b/ABC123?action=join");
    expect(message).toContain("1. Toque no link");
    expect(message).toContain("2. Entre ou crie sua conta");
    expect(message).toContain("3. Confirme sua entrada no bolao");
    expect(message).toContain("Pode mostrar esse QR no bar ou no evento");
  });

  it("normalizes the QR poster file name for bars and events", () => {
    expect(buildQrPosterFileName({ name: "Bar & Copa 2026", inviteCode: "abc123" })).toBe(
      "qr-bolao-bar-copa-2026-ABC123.png",
    );
  });
});
