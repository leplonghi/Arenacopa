import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { PoolContextChooser } from "@/features/boloes/create/PoolContextChooser";
import { useAuth } from "@/contexts/AuthContext";
import type { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

export function CreateBolaoContextStep({ flow }: { flow: Flow }) {
  const { user } = useAuth();
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!user?.id) {
      setAvailableGroups([]);
      return;
    }

    let mounted = true;
    void (async () => {
      const membershipSnapshot = await getDocs(
        query(collection(db, "grupo_members"), where("user_id", "==", user.id)),
      );
      const groupIds = Array.from(
        new Set(
          membershipSnapshot.docs
            .map((docSnapshot) => docSnapshot.data().grupo_id as string | undefined)
            .filter(Boolean),
        ),
      );
      const groups = await Promise.all(
        groupIds.map(async (groupId) => {
          const snapshot = await getDoc(doc(db, "grupos", groupId));
          return snapshot.exists()
            ? { id: snapshot.id, name: String(snapshot.data().name || "Grupo") }
            : null;
        }),
      );
      if (!mounted) {
        return;
      }
      setAvailableGroups(groups.filter(Boolean) as Array<{ id: string; name: string }>);
    })().catch(() => {
      if (mounted) {
        setAvailableGroups([]);
      }
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Etapa 1 de 4</p>
      <h1 className="mt-2 text-3xl font-black">Onde esse bolão vai viver?</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Primeiro definimos o contexto. O nome vem depois, quando a estrutura já estiver clara.
      </p>

      <div className="mt-8">
        <PoolContextChooser
          value={flow.state.contextMode}
          onChange={(value) =>
            flow.setState((current) => ({
              ...current,
              contextMode: value,
              accessMode:
                value === "existing_group" && current.selectedGrupoId
                  ? "group_gated"
                  : value === "standalone"
                    ? current.accessMode === "group_gated"
                      ? "approval"
                      : current.accessMode
                    : current.accessMode,
            }))
          }
          hasGroups={availableGroups.length > 0 || Boolean(flow.state.selectedGrupoId)}
        />
      </div>

      {flow.state.contextMode === "existing_group" ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Escolha o grupo</p>
          <div className="mt-3 grid gap-3">
            {availableGroups.length === 0 && flow.state.selectedGrupoId ? (
              <div className="rounded-2xl border border-primary bg-primary/10 px-4 py-4">
                <p className="font-black">Grupo pré-selecionado</p>
                <p className="mt-1 text-sm text-zinc-300">{flow.state.selectedGrupoId}</p>
              </div>
            ) : null}

            {availableGroups.map((group) => (
              <button
                key={group.id}
                onClick={() =>
                  flow.setState((current) => ({
                    ...current,
                    selectedGrupoId: group.id,
                    accessMode: current.accessMode === "public" ? "public" : "group_gated",
                  }))
                }
                className={`rounded-2xl border p-4 text-left ${
                  flow.state.selectedGrupoId === group.id
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-[#0c1811]"
                }`}
              >
                <p className="font-black">{group.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Se o bolão nascer aqui, o grupo pode descobrir ou controlar a entrada.
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {flow.state.contextMode === "new_group" ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Crie o grupo base</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["👥", "⚽", "🏆", "🔥", "🎯", "🎉"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => flow.setState((current) => ({ ...current, newGroupEmoji: emoji }))}
                className={`rounded-2xl border p-3 text-2xl ${
                  flow.state.newGroupEmoji === emoji
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-[#0c1811]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <input
              value={flow.state.newGroupName}
              onChange={(event) =>
                flow.setState((current) => ({ ...current, newGroupName: event.target.value }))
              }
              placeholder="Nome do grupo"
              className="rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-base text-white"
            />
            <textarea
              value={flow.state.newGroupDescription}
              onChange={(event) =>
                flow.setState((current) => ({ ...current, newGroupDescription: event.target.value }))
              }
              placeholder="Descreva rapidamente o grupo"
              className="min-h-[100px] rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white"
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              onClick={() =>
                flow.setState((current) => ({
                  ...current,
                  newGroupVisibility: "private",
                  newGroupAdmissionMode: "approval",
                }))
              }
              className={`rounded-2xl border p-4 text-left ${
                flow.state.newGroupVisibility === "private"
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-[#0c1811]"
              }`}
            >
              <p className="font-black">Grupo privado</p>
              <p className="mt-1 text-sm text-zinc-400">Entrada por solicitação e aprovação.</p>
            </button>
            <button
              onClick={() =>
                flow.setState((current) => ({
                  ...current,
                  newGroupVisibility: "public",
                  newGroupAdmissionMode: "direct_code_or_invite",
                }))
              }
              className={`rounded-2xl border p-4 text-left ${
                flow.state.newGroupVisibility === "public"
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-[#0c1811]"
              }`}
            >
              <p className="font-black">Grupo público</p>
              <p className="mt-1 text-sm text-zinc-400">Entrada direta por link ou código.</p>
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => flow.setStep("type")}
          disabled={!flow.canAdvance}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
