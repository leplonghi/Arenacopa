import { useState, useEffect, useRef } from "react";
import { teams, getTeam } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Bell, Sparkles, Goal, Newspaper, Clock, Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Perfil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ name: string; bio: string; avatar_url: string | null } | null>(null);
  const [favoriteTeam, setFavoriteTeam] = useState("BRA");
  const [funMode, setFunMode] = useState(true);
  const [notifications, setNotifications] = useState({ goals: true, news: false, matchStart: true });
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  // ✅ Load all preferences from Supabase on mount
  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;
    supabase
      .from("profiles")
      .select("name, bio, avatar_url, favorite_team, fun_mode, notifications")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({ name: data.name, bio: data.bio, avatar_url: data.avatar_url });
          if ((data as any).favorite_team) setFavoriteTeam((data as any).favorite_team as string);
          if ((data as any).fun_mode !== undefined) setFunMode((data as any).fun_mode as boolean);
          if ((data as any).notifications) {
            setNotifications((data as any).notifications as typeof notifications);
          }
        }
        setLoading(false);
      });
  }, [user]);

  // ✅ Persist favorite team when it changes (debounced)
  const saveTeam = async (code: string) => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ favorite_team: code } as any)
      .eq("user_id", user.id);
    setSaving(false);
    toast({ title: `Time favorito: ${getTeam(code).name} ${getTeam(code).flag}`, duration: 1500 });
  };

  const handleTeamChange = (code: string) => {
    setFavoriteTeam(code);
    setShowTeamPicker(false);
    saveTeam(code);
  };

  // ✅ Persist fun_mode when it changes
  const handleFunModeToggle = async () => {
    if (!user) return;
    const next = !funMode;
    setFunMode(next);
    await supabase.from("profiles").update({ fun_mode: next } as any).eq("user_id", user.id);
  };

  // ✅ Persist notifications when a toggle changes
  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    if (!user) return;
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    await supabase
      .from("profiles")
      .update({ notifications: next } as any)
      .eq("user_id", user.id);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const team = getTeam(favoriteTeam);
  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Profile header */}
      <div className="flex flex-col items-center pt-4 pb-2">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-copa-green to-copa-green-light flex items-center justify-center text-3xl font-black mb-3 border-4 border-primary/20">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <h2 className="text-xl font-black">{displayName}</h2>
        <span className="text-xs text-muted-foreground">{user?.email}</span>
        {saving && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Salvando…
          </div>
        )}
      </div>

      {/* My Team */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Meu Time</h3>
          </div>
          <button onClick={() => setShowTeamPicker(!showTeamPicker)} className="text-xs text-primary font-semibold">
            Editar
          </button>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <Flag code={team.code} size="xl" className="border-2 border-copa-green/30" />
            <div>
              <h4 className="text-base font-black">{team.name}</h4>
              <span className="text-xs text-muted-foreground">Grupo {team.group}</span>
            </div>
            <div className="ml-auto">
              <Check className="w-4 h-4 text-copa-green-light" />
            </div>
          </div>

          <div className="pt-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Troca Rápida</span>
            <div className="flex gap-2 flex-wrap">
              {/* Show BRA + ARG + ENG + FRA as quick picks — more relevant globally */}
              {["BRA", "ARG", "ENG", "FRA"].map((code) => {
                const t = getTeam(code);
                return (
                  <button
                    key={code}
                    onClick={() => handleTeamChange(code)}
                    className={cn(
                      "w-11 h-11 rounded-full overflow-hidden transition-all",
                      favoriteTeam === code && "ring-2 ring-primary"
                    )}
                  >
                    <Flag code={t.code} size="md" className="w-11 h-11" />
                  </button>
                );
              })}
              <button
                onClick={() => setShowTeamPicker(true)}
                className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-lg text-muted-foreground"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {showTeamPicker && (
          <div className="glass-card mt-2 p-3 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-5 gap-1.5">
              {teams.map((t) => (
                <button
                  key={t.code}
                  onClick={() => handleTeamChange(t.code)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors",
                    favoriteTeam === t.code ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-secondary"
                  )}
                >
                  <Flag code={t.code} size="sm" />
                  <span className="text-[8px] font-bold">{t.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Fun Mode */}
      <div className="rounded-xl bg-gradient-to-r from-primary/80 to-primary p-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-black">Modo Festa</span>
          </div>
          <p className="text-[11px] text-primary-foreground/80 leading-relaxed">
            Ative animações de festa, confetes nos gols e comentários engraçados.
          </p>
        </div>
        <button
          onClick={handleFunModeToggle}
          className={cn(
            "w-12 h-7 rounded-full transition-colors relative shrink-0",
            funMode ? "bg-background/30" : "bg-background/10"
          )}
        >
          <span className={cn(
            "absolute top-1 w-5 h-5 rounded-full bg-foreground shadow transition-transform",
            funMode ? "left-6" : "left-1"
          )} />
        </button>
      </div>

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notificações</h3>
        </div>
        <div className="glass-card divide-y divide-border/30">
          {[
            { key: "goals" as const, icon: Goal, label: "Gols das Partidas", desc: "Alertas instantâneos de gol" },
            { key: "news" as const, icon: Newspaper, label: "Notícias & Transferências", desc: "Resumo diário — ativa feed na tela inicial" },
            { key: "matchStart" as const, icon: Clock, label: "Início de Partida", desc: "15 min antes do jogo" },
          ].map((n) => (
            <div key={n.key} className="flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <n.icon className="w-4 h-4 text-copa-green-light" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold block">{n.label}</span>
                <span className="text-[10px] text-muted-foreground">{n.desc}</span>
              </div>
              <button
                onClick={() => handleNotificationToggle(n.key)}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative shrink-0",
                  notifications[n.key] ? "bg-primary" : "bg-secondary"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-foreground shadow transition-transform",
                  notifications[n.key] ? "left-6" : "left-1"
                )} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground mt-2 px-1">
          Push notifications serão ativadas com a chegada da Copa em Junho/2026.
        </p>
      </section>

      {/* Logout */}
      <button
        onClick={handleSignOut}
        className="w-full glass-card p-3.5 flex items-center justify-center gap-2 text-sm font-black text-copa-live uppercase tracking-wider"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>

      <p className="text-center text-[10px] text-muted-foreground">ArenaCopa Versão 2.5.0</p>
    </div>
  );
};

export default Perfil;
