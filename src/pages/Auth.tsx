import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/arenacopa_logo.png";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Algo deu errado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google");
      if (result.error) throw result.error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao entrar com Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden mb-4">
          <img src={logo} alt="ArenaCopa" className="h-14 w-14" />
        </div>
        <h1 className="font-black text-2xl tracking-tight">
          ARENA<span className="text-primary">COPA</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Copa do Mundo 2026</p>
      </div>

      {/* Tab switcher */}
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
            {m === "login" ? "Entrar" : "Criar Conta"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {mode === "signup" && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
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
            placeholder="Email"
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
            placeholder="Senha"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? "Entrar" : "Criar Conta"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6 w-full max-w-sm">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full max-w-sm py-3.5 rounded-xl bg-secondary border border-border text-sm font-bold flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Entrar com Google
      </button>
    </div>
  );
};

export default Auth;
