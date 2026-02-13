import { useState } from "react";
import { teams, userProfile, getTeam } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Bell, Sparkles, Goal, Newspaper, Clock } from "lucide-react";

const Perfil = () => {
  const [favoriteTeam, setFavoriteTeam] = useState(userProfile.favoriteTeam);
  const [funMode, setFunMode] = useState(true);
  const [notifications, setNotifications] = useState(userProfile.notifications);
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  const team = getTeam(favoriteTeam);

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Profile header */}
      <div className="flex flex-col items-center pt-4 pb-2">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-copa-green to-copa-green-light flex items-center justify-center text-5xl mb-3 border-4 border-primary/20">
          {userProfile.avatar}
        </div>
        <h2 className="text-xl font-black">{userProfile.name}</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary/20 text-primary mt-1">
          Membro Pro
        </span>
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
              <span className="text-xs text-muted-foreground">Ranking Atual: #1</span>
            </div>
          </div>

          {/* Quick switch */}
          <div className="pt-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Troca Rápida</span>
            <div className="flex gap-2">
              {teams.slice(0, 4).map(t => (
                <button
                  key={t.code}
                  onClick={() => setFavoriteTeam(t.code)}
                  className={cn(
                    "w-11 h-11 rounded-full overflow-hidden transition-all",
                    favoriteTeam === t.code && "ring-2 ring-primary"
                  )}
                >
                  <Flag code={t.code} size="md" className="w-11 h-11" />
                </button>
              ))}
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
          onClick={() => setFunMode(!funMode)}
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
            { key: "news" as const, icon: Newspaper, label: "Notícias & Transferências", desc: "Resumo diário" },
            { key: "matchStart" as const, icon: Clock, label: "Início de Partida", desc: "15 min antes do jogo" },
          ].map(n => (
            <div key={n.key} className="flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <n.icon className="w-4 h-4 text-copa-green-light" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold block">{n.label}</span>
                <span className="text-[10px] text-muted-foreground">{n.desc}</span>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
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
      </section>

      {/* Logout */}
      <button className="w-full glass-card p-3.5 flex items-center justify-center gap-2 text-sm font-black text-copa-live uppercase tracking-wider">
        <LogOut className="w-4 h-4" />
        Sair
      </button>

      <p className="text-center text-[10px] text-muted-foreground">ArenaCopa Versão 2.4.0</p>
    </div>
  );
};

export default Perfil;
