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
import { auth, db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("profile");

  const [step, setStep] = useState<Step>("confirm");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const supportEmail = "suporte@arenacup.com";
  const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
    t("delete_account.mail.subject")
  )}&body=${encodeURIComponent(t("delete_account.mail.body"))}`;

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
      setErrorMsg(t("delete_account.errors.incorrect_password"));
    }
  };

  // ── core deletion ──────────────────────────────────────────────────────────
  const performDeletion = async () => {
    if (!user || !session) return;
    setStep("deleting");
    setErrorMsg("");

    try {
      const uid = user.id;

      // Delete dependent documents before memberships so Firestore read rules
      // based on membership do not lock us out mid-deletion.
      await deleteQueryBatch(
        query(collection(db, "bolao_palpites"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "bolao_predictions"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "bolao_champion_predictions"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "bolao_onboarding_state"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "bolao_extra_bets"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "notifications"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "push_subscriptions"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "native_push_tokens"), where("user_id", "==", uid))
      );
      await deleteQueryBatch(
        query(collection(db, "bolao_members"), where("user_id", "==", uid))
      );
      await deleteDoc(doc(db, "profiles", uid));
      await deleteDoc(doc(db, "public_profiles", uid));

      // Delete Firebase Auth account (must be last)
      await deleteUser(session);

      // Sign out locally and clear state
      await signOut();

      setStep("done");
    } catch (err: unknown) {
      console.error("Error deleting account:", err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes("requires-recent-login")) {
        setErrorMsg(t("delete_account.errors.recent_login"));
        setStep("reauth");
      } else {
        setErrorMsg(
          t("delete_account.errors.generic", { email: supportEmail })
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
          <h1 className="text-2xl font-bold text-white">
            {t("delete_account.title")}
          </h1>
          <p className="text-gray-400 text-sm">
            {t("delete_account.brand_label")}
          </p>
        </div>

        {/* ── CONFIRM ── */}
        {step === "confirm" && (
          <>
            {user ? (
              <>
                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 space-y-2">
                  <p className="text-red-400 font-semibold text-sm">
                    {t("delete_account.confirm.warning")}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {t("delete_account.confirm.list_intro")}
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4 list-disc">
                    <li>{t("delete_account.confirm.items.account")}</li>
                    <li>{t("delete_account.confirm.items.profile")}</li>
                    <li>{t("delete_account.confirm.items.predictions")}</li>
                    <li>{t("delete_account.confirm.items.memberships")}</li>
                    <li>{t("delete_account.confirm.items.champion")}</li>
                    <li>{t("delete_account.confirm.items.tokens")}</li>
                  </ul>
                </div>

                <p className="text-gray-400 text-sm text-center">
                  {t("delete_account.confirm.connected_as")}{" "}
                  <span className="text-white">{user.email}</span>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    {t("delete_account.confirm.cancel")}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                  >
                    {t("delete_account.confirm.cta")}
                  </button>
                </div>
              </>
            ) : (
              /* Not logged in */
              <div className="space-y-4">
                <p className="text-gray-300 text-sm text-center">
                  {t("delete_account.not_logged_in.intro")}
                </p>
                <ol className="text-gray-300 text-sm space-y-2 ml-4 list-decimal">
                  <li>{t("delete_account.not_logged_in.steps.login")}</li>
                  <li>
                    {t("delete_account.not_logged_in.steps.settings_prefix")}{" "}
                    <strong className="text-white">
                      {t("delete_account.not_logged_in.steps.settings_path")}
                    </strong>
                  </li>
                  <li>
                    {t("delete_account.not_logged_in.steps.delete_prefix")}{" "}
                    <strong className="text-white">
                      {t("delete_account.not_logged_in.steps.delete_label")}
                    </strong>
                  </li>
                  <li>{t("delete_account.not_logged_in.steps.confirm")}</li>
                </ol>
                <p className="text-gray-400 text-sm text-center">
                  {t("delete_account.not_logged_in.email_prefix")}{" "}
                  <a
                    href={supportMailto}
                    className="text-green-400 underline"
                  >
                    {supportEmail}
                  </a>
                </p>
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                >
                  {t("delete_account.not_logged_in.cta")}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── RE-AUTH (email/password only) ── */}
        {step === "reauth" && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm text-center">
              {t("delete_account.reauth.desc")}
            </p>
            <input
              type="password"
              placeholder={t("delete_account.reauth.password_placeholder")}
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
                {t("delete_account.reauth.back")}
              </button>
              <button
                onClick={handleReauth}
                disabled={!password}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {t("delete_account.reauth.confirm")}
              </button>
            </div>
          </div>
        )}

        {/* ── DELETING ── */}
        {step === "deleting" && (
          <div className="text-center space-y-4 py-4">
            <div className="animate-spin text-4xl">⚙️</div>
            <p className="text-white font-medium">
              {t("delete_account.deleting.title")}
            </p>
            <p className="text-gray-400 text-sm">
              {t("delete_account.deleting.desc")}
            </p>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✅</div>
            <p className="text-white font-semibold text-lg">
              {t("delete_account.done.title")}
            </p>
            <p className="text-gray-400 text-sm">
              {t("delete_account.done.desc")}
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              {t("delete_account.done.cta")}
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">❌</div>
            <p className="text-red-400 font-medium">
              {t("delete_account.error.title")}
            </p>
            {errorMsg && <p className="text-gray-400 text-sm">{errorMsg}</p>}
            <button
              onClick={() => { setStep("confirm"); setErrorMsg(""); }}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              {t("delete_account.error.retry")}
            </button>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-gray-600 text-xs mt-6 text-center max-w-sm">
        {t("delete_account.footer.prefix")}{" "}
        <a href="/privacidade" className="text-gray-400 underline">
          {t("delete_account.footer.link")}
        </a>
        .
      </p>
    </div>
  );
}
