import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GrupoLinkPanelProps {
  bolaoId: string;
  currentGrupoId: string | null;
  onLinkedGroupChange?: (grupoId: string | null) => void;
}

export function GrupoLinkPanel({ currentGrupoId }: GrupoLinkPanelProps) {
  const { t } = useTranslation("bolao");
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchGrupos = async () => {
      try {
        const gruposQuery = query(collection(db, "grupos"), where("creator_id", "==", user.id));
        const snapshot = await getDocs(gruposQuery);
        setGrupos(snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name })));
      } catch (error) {
        console.error(error);
      }
    };

    void fetchGrupos();
  }, [user]);

  if (grupos.length === 0) {
    return null;
  }

  const currentGrupo = grupos.find((grupo) => grupo.id === currentGrupoId);

  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <p className="text-[12px] font-black uppercase text-zinc-300">{t("group_link.title")}</p>
      <p className="mb-3 text-xs text-zinc-500">
        O vínculo com grupo agora faz parte da edição estruturada do bolão. Esse campo não aceita mais alteração direta por write do cliente.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
        <p className="font-black text-white">{currentGrupo ? currentGrupo.name : "Sem grupo vinculado"}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Use o novo painel de edição para revisar contexto, política de entrada e relação com grupos antes de publicar.
        </p>
      </div>
    </div>
  );
}
