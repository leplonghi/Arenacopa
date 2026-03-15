import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { signInWithGoogle, signInWithPassword, signUpWithPassword } from "@/services/auth/auth.service";
import { acceptTerms, ensureProfile, updateProfile } from "@/services/profile/profile.service";

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
  const [searchParams] = useSearchParams();
  const { loginAsDemo } = useAuth();
  const { t } = useTranslation('auth');
  const redirectPath = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      localStorage.removeItem("demo_mode");

      if (mode === "signup") {
        if (!acceptedTerms) return;
        const createdUser = await signUpWithPassword(email, password, name);

        if (createdUser) {
          await ensureProfile({
            id: createdUser.uid,
            email: createdUser.email ?? null,
            user_metadata: {
              full_name: name,
              name,
              avatar_url: createdUser.photoURL ?? undefined,
            },
          });

          await updateProfile(createdUser.uid, {
            name,
            terms_accepted: true,
          });
          await acceptTerms(createdUser.uid);
        }

        toast({
          title: t('login.success_create'),
          description: t('login.success_create_desc'),
        });

        if (createdUser) {
          navigate(redirectPath);
        }
      } else {
        await signInWithPassword(email, password);
        navigate(redirectPath);
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
      localStorage.removeItem("demo_mode");
      const redirectTo = `${window.location.origin}${redirectPath}`;
      await signInWithGoogle();
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
      navigate(redirectPath);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* ── Football Field Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Deep green base */}
        <div className="absolute inset-0 bg-[hsl(154_50%_8%)]" />

        {/* Football field SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.13]"
          viewBox="0 0 375 812"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Field stripes */}
          {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
            <rect key={i} x={0} y={i * 68} width={375} height={34} fill={i % 2 === 0 ? "#22c55e" : "#16a34a"} />
          ))}
          {/* Outer boundary */}
          <rect x="18" y="36" width="339" height="740" rx="4" stroke="white" strokeWidth="2.5" />
          {/* Halfway line */}
          <line x1="18" y1="406" x2="357" y2="406" stroke="white" strokeWidth="2" />
          {/* Centre circle */}
          <circle cx="187.5" cy="406" r="72" stroke="white" strokeWidth="2" />
          <circle cx="187.5" cy="406" r="3" fill="white" />
          {/* Top penalty area */}
          <rect x="85" y="36" width="205" height="100" rx="2" stroke="white" strokeWidth="2" />
          {/* Top goal area */}
          <rect x="132" y="36" width="111" height="44" rx="2" stroke="white" strokeWidth="2" />
          {/* Top goal */}
          <rect x="152" y="24" width="71" height="16" rx="2" stroke="white" strokeWidth="2" />
          {/* Top penalty spot */}
          <circle cx="187.5" cy="104" r="3" fill="white" />
          {/* Top penalty arc */}
          <path d="M140 136 Q187.5 88 235 136" stroke="white" strokeWidth="2" fill="none" />
          {/* Bottom penalty area */}
          <rect x="85" y="676" width="205" height="100" rx="2" stroke="white" strokeWidth="2" />
          {/* Bottom goal area */}
          <rect x="132" y="732" width="111" height="44" rx="2" stroke="white" strokeWidth="2" />
          {/* Bottom goal */}
          <rect x="152" y="772" width="71" height="16" rx="2" stroke="white" strokeWidth="2" />
          {/* Bottom penalty spot */}
          <circle cx="187.5" cy="708" r="3" fill="white" />
          {/* Bottom penalty arc */}
          <path d="M140 676 Q187.5 724 235 676" stroke="white" strokeWidth="2" fill="none" />
          {/* Corner arcs */}
          <path d="M18 36 Q30 36 30 48" stroke="white" strokeWidth="2" fill="none" />
          <path d="M357 36 Q345 36 345 48" stroke="white" strokeWidth="2" fill="none" />
          <path d="M18 776 Q30 776 30 764" stroke="white" strokeWidth="2" fill="none" />
          <path d="M357 776 Q345 776 345 764" stroke="white" strokeWidth="2" fill="none" />
        </svg>

        {/* Overlay gradients to fade the field and make the form readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(154_50%_8%/0.55)] via-[hsl(154_50%_8%/0.45)] to-[hsl(154_50%_8%/0.7)]" />
        {/* Gold glow top */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-[hsl(44_80%_46%/0.12)] blur-[80px]" />
        {/* Green glow bottom */}
        <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[hsl(145_60%_30%/0.15)] blur-[70px]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-[28px] overflow-hidden mb-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/10">
          <img src="/logo.png" alt="ArenaCopa" className="w-full h-full object-cover" />
        </div>
        <h1 className="font-black text-2xl tracking-tight">
          ARENA<span className="text-primary">COPA</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{t('login.subtitle')}</p>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">
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
      </div>{/* end z-10 wrapper */}
    </div>
  );
};

export default Auth;
