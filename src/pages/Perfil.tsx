import { useState } from "react";
import { teams, userProfile, getTeam } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { LogOut, ChevronRight, Sparkles } from "lucide-react";

const funModes = [
  { id: "off", label: "Desligado", desc: "Experiência padrão" },
  { id: "leve", label: "Leve", desc: "Animações sutis, confetti nos gols" },
  { id: "medio", label: "Médio", desc: "Comentários engraçados, reações animadas" },
  { id: "caotico", label: "Caótico", desc: "Tudo ligado! Caos total 🎉" },
] as const;

const Perfil = () => {
  const [favoriteTeam, setFavoriteTeam] = useState(userProfile.favoriteTeam);
  const [funMode, setFunMode] = useState(userProfile.funMode);
  const [notifications, setNotifications] = useState(userProfile.notifications);
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  const team = getTeam(favoriteTeam);

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Profile header */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
          {userProfile.avatar}
        </div>
        <div>
          <h2 className="text-lg font-black">{userProfile.name}</h2>
          <span className="text-xs text-muted-foreground">Membro desde {userProfile.memberSince}</span>
        </div>
      </div>

      {/* Favorite team */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Meu Time</h3>
        <button
          onClick={() => setShowTeamPicker(!showTeamPicker)}
          className="glass-card-hover w-full p-3 flex items-center gap-3"
        >
          <span className="text-2xl">{team.flag}</span>
          <div className="flex-1 text-left">
            <span className="text-sm font-bold block">{team.name}</span>
            <span className="text-xs text-muted-foreground">Grupo {team.group}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {showTeamPicker && (
          <div className="glass-card mt-2 p-3 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1.5">
              {teams.map(t => (
                <button
                  key={t.code}
                  onClick={() => {
                    setFavoriteTeam(t.code);
                    setShowTeamPicker(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors",
                    favoriteTeam === t.code ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-secondary"
                  )}
                >
                  <span className="text-lg">{t.flag}</span>
                  <span className="text-[9px] font-bold">{t.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Fun mode */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modo Divertido</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {funModes.map(m => (
            <button
              key={m.id}
              onClick={() => setFunMode(m.id)}
              className={cn(
                "glass-card p-3 text-left transition-all",
                funMode === m.id && "ring-2 ring-primary bg-primary/5"
              )}
            >
              <span className="text-xs font-bold block">{m.label}</span>
              <span className="text-[10px] text-muted-foreground">{m.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Notificações</h3>
        <div className="glass-card divide-y divide-border/50">
          {[
            { key: "goals" as const, label: "Gols", desc: "Notificar quando sair gol" },
            { key: "news" as const, label: "Notícias", desc: "Destaques e novidades" },
            { key: "matchStart" as const, label: "Início de Jogo", desc: "Aviso antes do jogo começar" },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between p-3">
              <div>
                <span className="text-sm font-medium block">{n.label}</span>
                <span className="text-[11px] text-muted-foreground">{n.desc}</span>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  notifications[n.key] ? "bg-primary" : "bg-secondary"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  notifications[n.key] ? "translate-x-4.5 left-0" : "left-0.5"
                )} style={{ transform: notifications[n.key] ? "translateX(18px)" : "translateX(0)" }} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Logout */}
      <button className="w-full glass-card p-3 flex items-center justify-center gap-2 text-sm font-medium text-copa-live">
        <LogOut className="w-4 h-4" />
        Sair da conta
      </button>

      <p className="text-center text-[10px] text-muted-foreground">ArenaCopa v1.0.0</p>
    </div>
  );
};

export default Perfil;
