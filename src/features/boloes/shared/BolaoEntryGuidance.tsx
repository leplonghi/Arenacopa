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
      <ArenaSectionHeader eyebrow="Guia rápido" title="Como começar do jeito certo" />

      <p className="mt-4 text-sm font-semibold leading-6 text-zinc-200">
        {groupId
          ? `Este grupo${groupName ? ` (${groupName})` : ""} pode descobrir ou controlar a entrada dos bolões vinculados.`
          : "Você pode criar um bolão independente ou começar a partir de um grupo existente."}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
        Primeiro você decide o vínculo e o tipo do bolão. O nome vem depois, quando a estrutura já estiver clara.
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
