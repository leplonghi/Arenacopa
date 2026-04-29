import { Link } from "react-router-dom";
import { ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

type BolaoEntryGuidanceProps = {
  groupId?: string | null;
  groupName?: string | null;
  showUngroupedAction?: boolean;
};

export function BolaoEntryGuidance({
  groupId,
  groupName,
  showUngroupedAction = true,
}: BolaoEntryGuidanceProps) {
  const createInGroupHref = groupId ? `/boloes/criar?grupoId=${groupId}` : null;

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 text-white backdrop-blur-xl">
      <ArenaSectionHeader
        eyebrow="Guia rápido"
        title="Começar"
        hint="Você escolhe primeiro se o bolão vive sozinho, em um grupo existente ou junto de um novo grupo. O nome vem depois."
      />

      <p className="mt-4 text-sm font-semibold leading-6 text-zinc-200">
        {groupId
          ? `Este grupo${groupName ? ` (${groupName})` : ""} pode centralizar bolões e controlar entradas quando a participação depender dele.`
          : "Bolão independente ou com grupo."}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {showUngroupedAction && (
          <Link
            to="/boloes/criar"
            className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.06]"
          >
            Criar sem grupo
          </Link>
        )}

        {createInGroupHref && (
          <Link
            to={createInGroupHref}
            className="rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
          >
            Criar neste grupo
          </Link>
        )}
      </div>
    </div>
  );
}
