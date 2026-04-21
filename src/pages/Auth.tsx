import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { signInWithGoogle, signInWithPassword, signUpWithPassword } from "@/services/auth/auth.service";
import { getDefaultProfileName } from "@/i18n/language";
import { acceptTerms, ensureProfile, updateProfile } from "@/services/profile/profile.service";
import { sanitizeInternalRedirect } from "@/lib/security";
import { BrandWordmark } from "@/components/BrandWordmark";

const Auth = () => {
  const logoUrl = "/logo.png?v=20260316";
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
  const { user } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const brandName = t('common:brand.name');
  const redirectPath = sanitizeInternalRedirect(searchParams.get("redirect"));

  const getSafeAuthError = (fallback: string, error: unknown) => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes("muitas tentativas")) {
        return error.message;
      }
    }

    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {


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
      toast({
        title: t('login.error'),
        description: getSafeAuthError(t('login.error'), error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {

      const googleUser = await signInWithGoogle();
      await ensureProfile({
        id: googleUser.uid,
        email: googleUser.email ?? null,
        user_metadata: {
          full_name: googleUser.displayName || undefined,
          name: googleUser.displayName || undefined,
          avatar_url: googleUser.photoURL || undefined,
        },
      });

      await updateProfile(googleUser.uid, {
        name: googleUser.displayName || googleUser.email?.split("@")[0] || getDefaultProfileName(),
      });

      navigate(redirectPath);
    } catch (error) {
      console.error("Erro no login com Google:", error);
      toast({
        title: t('login.error'),
        description: getSafeAuthError(t('login.error_google'), error),
        variant: "destructive",
      });
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background is handled globally by FieldBackground component in App.tsx */}

      {/* ── Content ── */}
      <div className="relative z-10 mb-10 flex flex-col items-center">
        <div className="mb-4 flex h-32 w-32 items-center justify-center">
          <img
            src={logoUrl}
            alt={brandName}
            className="h-full w-full object-contain brightness-110"
          />
        </div>
        <h1 className="drop-shadow-lg">
          <BrandWordmark
            label={brandName}
            className="font-black text-3xl tracking-tighter italic text-white"
          />
        </h1>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] mt-1 opacity-80">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="mx-auto mb-8 flex w-fit items-center justify-center gap-2 rounded-full border border-white/5 bg-black/20 p-1 backdrop-blur-sm">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "min-w-[140px] rounded-full px-8 py-2 text-center text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                mode === m 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-white"
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
          className="w-full py-4 rounded-xl bg-white text-black hover:bg-white/90 transition-all text-sm font-black flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-white/5 active:scale-[0.98] mb-8"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {t('login.google')}
        </button>

        <div className="flex items-center gap-4 mb-8 w-full">
          <div className="flex-1 h-px bg-border/30" />
          <span className="px-4 text-[10px] font-bold text-white/50 uppercase tracking-widest bg-transparent">
            {t('login.or')}
          </span>
          <div className="flex-1 h-px bg-border/30" />
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {mode === "signup" && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('login.name')}
                required
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-card/50 backdrop-blur-md border border-white/5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.email')}
              required
              className="w-full pl-11 pr-4 py-4 rounded-xl bg-card/50 backdrop-blur-md border border-white/5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.password')}
              required
              minLength={6}
              className="w-full pl-11 pr-11 py-4 rounded-xl bg-card/50 backdrop-blur-md border border-white/5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
              className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-primary transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>

          {mode === "signup" && (
            <div className="flex items-start gap-3 mt-4 mb-2 p-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 flex-shrink-0 w-4 h-4 rounded border-white/10 bg-black/40 text-primary focus:ring-primary/50"
              />
              <label htmlFor="terms" className="text-[10px] text-muted-foreground leading-snug">
                {t('terms.read_prefix')}{" "}
                <Link to="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{t('terms.use_terms')}</Link>
                {" "}{t('terms.and')}{" "}
                <Link to="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{t('terms.privacy_policy')}</Link>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "signup" && !acceptedTerms)}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all mt-4"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? t('login.submit_login') : t('login.submit_signup')}
          </button>
        </form>


      </div>
    </div>
  );
};

export default Auth;
