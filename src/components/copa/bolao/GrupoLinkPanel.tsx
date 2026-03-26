import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface GrupoLinkPanelProps {
  bolaoId: string;
  currentGrupoId: string | null;
}

export function GrupoLinkPanel({ bolaoId, currentGrupoId }: GrupoLinkPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [grupos, setGrupos] = useState<{ id: string; name: string }[]>([]);
  const [linking, setLinking] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<string>(currentGrupoId || "");

  useEffect(() => {
    if (!user) return;
    const fetchGrupos = async () => {
      try {
        const q = query(collection(db, "grupos"), where("creator_id", "==", user.id));
        const snap = await getDocs(q);
        setGrupos(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchGrupos();
  }, [user]);

  const handleLink = async () => {
    if (!selectedGrupo) return;
    setLinking(true);
    try {
      await updateDoc(doc(db, "boloes", bolaoId), {
        grupo_id: selectedGrupo
      });
      toast({ title: "Bolão vinculado ao grupo com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao vincular grupo", variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setLinking(true);
    try {
      await updateDoc(doc(db, "boloes", bolaoId), {
        grupo_id: null
      });
      setSelectedGrupo("");
      toast({ title: "Desvinculado do grupo." });
    } catch (err) {
      toast({ title: "Erro ao desvincular", variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  if (grupos.length === 0) return null; // No groups to link to

  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <p className="text-[12px] font-black uppercase text-zinc-300">Vincular a um Grupo</p>
      <p className="mb-4 text-xs text-zinc-500">
        Associe este bolão a um grupo que você gerencia para que ele apareça no dashboard do grupo.
      </p>
      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={selectedGrupo}
          onChange={(e) => setSelectedGrupo(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="" className="text-black">Selecionar grupo...</option>
          {grupos.map(g => (
            <option key={g.id} value={g.id} className="text-black">{g.name}</option>
          ))}
        </select>
        
        {currentGrupoId === selectedGrupo && selectedGrupo !== "" ? (
          <button
            onClick={handleUnlink}
            disabled={linking}
            className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/20 disabled:opacity-50"
          >
            {linking ? "..." : "Desvincular"}
          </button>
        ) : (
          <button
            onClick={handleLink}
            disabled={!selectedGrupo || linking}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary/90 disabled:opacity-50"
          >
            {linking ? "..." : "Vincular"}
          </button>
        )}
      </div>
    </div>
  );
}
