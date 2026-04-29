import { getInviteUrl } from "@/utils/site-url";

type ShareContext = "turma" | "bar" | "evento";

type WhatsAppMessageInput = {
  name: string;
  inviteCode: string;
  inviteUrl: string;
  context?: ShareContext;
};

type QrPosterFileInput = {
  name: string;
  inviteCode: string;
};

function normalizeInviteCode(inviteCode: string) {
  return inviteCode.trim().toUpperCase();
}

export function buildBolaoInviteUrl(inviteCode: string) {
  const code = normalizeInviteCode(inviteCode);
  return getInviteUrl(
    `/b/${code}?action=join&utm_source=whatsapp&utm_medium=share&utm_campaign=bolao_invite`,
  );
}

export function buildBolaoWhatsAppMessage({
  name,
  inviteCode,
  inviteUrl,
  context = "turma",
}: WhatsAppMessageInput) {
  const code = normalizeInviteCode(inviteCode);
  const contextLine =
    context === "bar" || context === "evento"
      ? "Pode mostrar esse QR no bar ou no evento para a galera entrar na hora."
      : "Manda para a turma e cada pessoa entra pelo link ou pelo codigo.";

  return [
    `Convite para o bolao "${name}" no ArenaCopa`,
    "",
    `Codigo: ${code}`,
    `Link direto: ${inviteUrl}`,
    "",
    "Como entrar:",
    "1. Toque no link",
    "2. Entre ou crie sua conta",
    "3. Confirme sua entrada no bolao",
    "",
    contextLine,
  ].join("\n");
}

export function buildQrPosterFileName({ name, inviteCode }: QrPosterFileInput) {
  const slug =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "bolao";

  return `qr-bolao-${slug}-${normalizeInviteCode(inviteCode)}.png`;
}
