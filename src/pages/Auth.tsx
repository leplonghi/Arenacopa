import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/integrations/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from "firebase/auth";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/escudo_arenacup_logo.png";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!acceptedTerms) return;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        try {
          // Import supabase locally to avoid issues if it's not used at top level
          const { supabase } = await import("@/integrations/supabase/client");
          // Attempt to update Supabase profile if using Supabase DB
          await supabase.from('profiles').update({
            accepted_terms_at: new Date().toISOString()
          }).eq('id', userCredential.user.uid);
        } catch (err) {
          console.error("Supabase profile update error:", err);
        }

        try {
          // Also attempt to update Firestore profile if using Firebase DB
          const { db } = await import("@/integrations/firebase/client");
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "profiles", userCredential.user.uid), {
            name: name,
            terms_accepted: true,
            accepted_terms_at: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.error("Firestore profile update error:", err);
        }

        toast({
          title: t('login.success_create'),
          description: t('login.success_create_desc'),
        });
        navigate("/");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Algo deu errado";
      toast({
        title: t('login.error'),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      console.error("Erro no login com Google:", error);
      const message = error instanceof Error ? error.message : t('login.error_google');
      toast({
        title: t('login.error'),
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginAsDemo();
      toast({
        title: "Modo Demo Ativado",
        description: "Você entrou no modo de demonstração.",
      });
      navigate("/");
    } catch (error) {
      console.error("Erro no login demo:", error);
      toast({
        title: "Erro Demo",
        description: t('login.error_demo'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden mb-4">
          <img src={logo} alt="ArenaCup" className="h-14 w-14" />
        </div>
        <h1 className="font-black text-2xl tracking-tight">
          ARENA<span className="text-primary">CUP</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{t('login.subtitle')}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            {m === "login" ? t('login.title') : t('login.create_account')}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full max-w-sm py-4 rounded-xl bg-white text-black hover:bg-white/90 transition-all text-sm font-black flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-white/5 active:scale-[0.98] mb-8"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {t('login.google')}
      </button>

      <div className="flex items-center gap-4 mb-8 w-full max-w-sm">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('login.or')}</span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {mode === "signup" && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('login.name')}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.email')}
            required
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('login.password')}
            required
            minLength={6}
            className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>

        {mode === "signup" && (
          <div className="flex items-start gap-3 mt-4 mb-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 flex-shrink-0 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
              Li e concordo com os{" "}
              <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Termos de Uso</a>
              {" "}e a{" "}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Política de Privacidade</a>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "signup" && !acceptedTerms)}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/10 hover:brightness-110 transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? t('login.submit_login') : t('login.submit_signup')}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={loading}
        className="mt-12 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-2 group disabled:opacity-50"
      >
        <div className="w-6 h-px bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
        {t('login.demo')}
        <div className="w-6 h-px bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
      </button>
    </div>
  );
};

export default Auth;
