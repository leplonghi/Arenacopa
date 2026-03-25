import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Delete all documents in a query using batched writes (max 500 per batch). */
async function deleteQueryBatch(q: ReturnType<typeof query>) {
  const snap = await getDocs(q);
  if (snap.empty) return;

  const BATCH_SIZE = 400;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

// ─── component ────────────────────────────────────────────────────────────────

type Step = "confirm" | "reauth" | "deleting" | "done" | "error";

export default function ExcluirConta() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("confirm");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── step 1: user clicks "Excluir minha conta" ──────────────────────────────
  const handleConfirm = () => {
    if (!user) {
      // not logged in — show instructions only
      return;
    }

    // Google Sign-In users don't need password re-auth (token is fresh)
    const providerId = session?.providerData?.[0]?.providerId ?? "";
    if (providerId === "google.com") {
      performDeletion();
    } else {
      setStep("reauth");
    }
  };

  // ── step 2 (email/password): re-authenticate then delete ───────────────────
  const handleReauth = async () => {
    if (!session?.email || !password) return;
    setErrorMsg("");
    try {
      const credential = EmailAuthProvider.credential(session.email, password);
      await reauthenticateWithCredential(session, credential);
      performDeletion();
    } catch {
      setErrorMsg(
        "Senha incorreta. Verifique e tente novamente. Se esqueceu sua senha, redefina-a antes de excluir a conta."
      );
    }
  };

  // ── core deletion ──────────────────────────────────────────────────────────
  const performDeletion = async () => {
    if (!user || !session) return;
    setStep("deleting");
    setErrorMsg("");

    try {
      const uid = user.id;

      // Delete all Firestore data belonging to this user in parallel
      await Promise.all([
        // Predictions
        deleteQueryBatch(
          query(collection(db, "bolao_palpites"), where("user_id", "==", uid))
        ),
        // Bolão memberships
        deleteQueryBatch(
          query(collection(db, "bolao_members"), where("user_id", "==", uid))
        ),
        // Champion predictions
        deleteQueryBatch(
          query(collection(db, "champion_predictions"), where("user_id", "==", uid))
        ),
        // Push tokens
        deleteQueryBatch(
          query(collection(db, "push_tokens"), where("user_id", "==", uid))
        ),
        // Profile
        deleteDoc(doc(db, "profiles", uid)),
      ]);

      // Delete Firebase Auth account (must be last)
      await deleteUser(session);

      // Sign out locally and clear state
      await signOut();

      setStep("done");
    } catch (err: unknown) {
      console.error("Error deleting account:", err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes("requires-recent-login")) {
        setErrorMsg(
          "Por segurança, faça logout e login novamente antes de excluir a conta."
        );
        setStep("reauth");
      } else {
        setErrorMsg(
          "Ocorreu um erro ao excluir sua conta. Tente novamente ou entre em contato: suporte@arenacup.com"
        );
        setStep("error");
      }
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Excluir Conta</h1>
          <p className="text-gray-400 text-sm">ArenaCup 2026</p>
        </div>

        {/* ── CONFIRM ── */}
        {step === "confirm" && (
          <>
            {user ? (
              <>
                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 space-y-2">
                  <p className="text-red-400 font-semibold text-sm">
                    Esta ação é permanente e não pode ser desfeita.
                  </p>
                  <p className="text-gray-300 text-sm">O seguinte será excluído permanentemente:</p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4 list-disc">
                    <li>Sua conta de acesso</li>
                    <li>Perfil e foto</li>
                    <li>Todos os seus palpites</li>
                    <li>Participação em bolões</li>
                    <li>Previsão de campeão</li>
                    <li>Tokens de notificação</li>
                  </ul>
                </div>

                <p className="text-gray-400 text-sm text-center">
                  Conectado como <span className="text-white">{user.email}</span>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                  >
                    Excluir minha conta
                  </button>
                </div>
              </>
            ) : (
              /* Not logged in */
              <div className="space-y-4">
                <p className="text-gray-300 text-sm text-center">
                  Para excluir sua conta e todos os seus dados, acesse o app e siga os passos abaixo:
                </p>
                <ol className="text-gray-300 text-sm space-y-2 ml-4 list-decimal">
                  <li>Abra o ArenaCup e faça login</li>
                  <li>Acesse <strong className="text-white">Perfil → Configurações</strong></li>
                  <li>Toque em <strong className="text-white">Excluir conta</strong></li>
                  <li>Confirme a ação</li>
                </ol>
                <p className="text-gray-400 text-sm text-center">
                  Prefere solicitar por e-mail?{" "}
                  <a
                    href="mailto:suporte@arenacup.com?subject=Solicitação de exclusão de conta&body=Olá, gostaria de solicitar a exclusão da minha conta e todos os meus dados do ArenaCup."
                    className="text-green-400 underline"
                  >
                    suporte@arenacup.com
                  </a>
                </p>
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                >
                  Fazer login para excluir
                </button>
              </div>
            )}
          </>
        )}

        {/* ── RE-AUTH (email/password only) ── */}
        {step === "reauth" && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm text-center">
              Por segurança, confirme sua senha para continuar.
            </p>
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReauth()}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500"
            />
            {errorMsg && (
              <p className="text-red-400 text-xs">{errorMsg}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("confirm"); setPassword(""); setErrorMsg(""); }}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleReauth}
                disabled={!password}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        )}

        {/* ── DELETING ── */}
        {step === "deleting" && (
          <div className="text-center space-y-4 py-4">
            <div className="animate-spin text-4xl">⚙️</div>
            <p className="text-white font-medium">Excluindo seus dados...</p>
            <p className="text-gray-400 text-sm">Isso pode levar alguns segundos. Não feche a página.</p>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✅</div>
            <p className="text-white font-semibold text-lg">Conta excluída com sucesso</p>
            <p className="text-gray-400 text-sm">
              Todos os seus dados foram removidos permanentemente do ArenaCup.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">❌</div>
            <p className="text-red-400 font-medium">Não foi possível excluir a conta</p>
            {errorMsg && <p className="text-gray-400 text-sm">{errorMsg}</p>}
            <button
              onClick={() => { setStep("confirm"); setErrorMsg(""); }}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-gray-600 text-xs mt-6 text-center max-w-sm">
        Para dúvidas sobre proteção de dados, consulte nossa{" "}
        <a href="/privacidade" className="text-gray-400 underline">Política de Privacidade</a>.
      </p>
    </div>
  );
}
