import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembrosTab } from "@/components/copa/bolao/MembrosTab";

const submitPoolMemberPaymentProof = vi.fn();
const updatePoolMemberPaymentStatus = vi.fn();

vi.mock("@/services/boloes/bolao-config.service", () => ({
  leaveBolao: vi.fn(),
  removePoolMember: vi.fn(),
  submitPoolMemberPaymentProof: (...args: unknown[]) => submitPoolMemberPaymentProof(...args),
  updatePoolMemberPaymentStatus: (...args: unknown[]) => updatePoolMemberPaymentStatus(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("MembrosTab payment proof", () => {
  beforeEach(() => {
    submitPoolMemberPaymentProof.mockReset().mockResolvedValue({
      member_id: "user-1_bolao-1",
      payment_proof_status: "submitted",
    });
    updatePoolMemberPaymentStatus.mockReset().mockResolvedValue({
      member_id: "user-2_bolao-1",
      payment_status: "paid",
    });
  });

  it("lets a participant submit pix proof and prize agreement", async () => {
    render(
      <MemoryRouter>
        <MembrosTab
          members={[
            {
              user_id: "user-1",
              role: "member",
              joined_at: "2026-04-27T10:00:00.000Z",
              payment_status: "pending",
              profile: { name: "Edu", avatar_url: null },
            },
          ]}
          userId="user-1"
          isCreator={false}
          bolaoId="bolao-1"
          isPaid
          onRefresh={() => undefined}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/ID do Pix/i), {
      target: { value: "Pix enviado pelo Banco X" },
    });
    fireEvent.click(screen.getByLabelText(/aceito a premiação/i));
    fireEvent.click(screen.getByRole("button", { name: /enviar comprovante/i }));

    await waitFor(() => {
      expect(submitPoolMemberPaymentProof).toHaveBeenCalledWith({
        payload: {
          bolao_id: "bolao-1",
          proof_text: "Pix enviado pelo Banco X",
          prize_agreement_accepted: true,
        },
      });
    });
  });

  it("lets the creator confirm a submitted pix proof", async () => {
    render(
      <MemoryRouter>
        <MembrosTab
          members={[
            {
              user_id: "user-2",
              role: "member",
              joined_at: "2026-04-27T10:00:00.000Z",
              payment_status: "pending",
              payment_proof_text: "Pix de R$ 25 enviado",
              payment_proof_status: "submitted",
              prize_agreement_accepted: true,
              prize_agreement_status: "submitted",
              profile: { name: "Ana", avatar_url: null },
            },
          ]}
          userId="owner-1"
          isCreator
          bolaoId="bolao-1"
          isPaid
          onRefresh={() => undefined}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirmar pix e premiação/i }));

    await waitFor(() => {
      expect(updatePoolMemberPaymentStatus).toHaveBeenCalledWith({
        payload: {
          bolao_id: "bolao-1",
          member_id: "user-2_bolao-1",
          payment_status: "paid",
        },
      });
    });
  });
});
