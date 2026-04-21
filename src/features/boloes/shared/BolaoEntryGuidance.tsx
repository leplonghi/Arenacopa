import { Link } from "react-router-dom";

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
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white">
      <p className="text-sm font-black">
        {groupId
          ? `Este grupo${groupName ? ` (${groupName})` : ""} pode descobrir ou controlar a entrada dos bolões vinculados.`
          : "Você pode criar um bolão independente ou começar a partir de um grupo existente."}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
        Primeiro você decide o vínculo e o tipo do bolão. O nome vem depois, quando a estrutura já estiver clara.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {showUngroupedAction && (
          <Link
            to="/boloes/criar"
            className="rounded-2xl border border-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
          >
            Criar sem grupo
          </Link>
        )}

        {createInGroupHref && (
          <Link
            to={createInGroupHref}
            className="rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black"
          >
            Criar neste grupo
          </Link>
        )}
      </div>
    </div>
  );
}
