import { useState, useEffect } from "react";
import { teams, getTeam } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Bell, Sparkles, Goal, Newspaper, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Calendar as CalendarIcon, Flag as FlagIcon } from "lucide-react";

const Perfil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{
    name: string;
    nickname: string | null;
    bio: string | null;
    avatar_url: string | null;
    birth_date: string | null;
    gender: string | null;
    nationality: string | null;
  } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    nickname: "",
    bio: "",
    birth_date: "",
    gender: "",
    nationality: ""
  });
  const [favoriteTeam, setFavoriteTeamState] = useState(() => localStorage.getItem("favorite_team") || "BRA");

  const setFavoriteTeam = (code: string) => {
    setFavoriteTeamState(code);
    localStorage.setItem("favorite_team", code);
  };
  const [funMode, setFunMode] = useState(true);
  const [notifications, setNotifications] = useState({ goals: true, news: false, matchStart: true });
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, nickname, bio, avatar_url, birth_date, gender, nationality")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data as any);
          setEditForm({
            name: data.name || "",
            nickname: data.nickname || "",
            bio: data.bio || "",
            birth_date: data.birth_date || "",
            gender: data.gender || "",
            nationality: data.nationality || ""
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  /* Safe access to team with fallback */
  const team = getTeam(favoriteTeam) || getTeam("BRA") || teams[0];
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-copa-green to-copa-green-light flex items-center justify-center text-3xl font-black mb-3 border-4 border-primary/20 relative group cursor-pointer overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}

          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-[10px] font-bold text-white uppercase">Alterar</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;

                try {
                  toast({ title: "Enviando...", description: "Atualizando sua foto de perfil." });

                  const fileExt = file.name.split('.').pop();
                  const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

                  const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file);

                  if (uploadError) throw uploadError;

                  const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: publicUrl })
                    .eq('user_id', user.id);

                  if (updateError) throw updateError;

                  setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
                  toast({ title: "Sucesso!", description: "Foto de perfil atualizada." });
                } catch (error) {
                  console.error('Error uploading avatar:', error);
                  toast({ title: "Erro", description: "Falha ao atualizar foto. Tente novamente.", variant: "destructive" });
                }
              }}
            />
          </label>
        </div>
        <h2 className="text-xl font-black">{displayName}</h2>
        <span className="text-xs text-muted-foreground">{user?.email}</span>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-3 h-7 text-xs gap-1.5">
              <Settings className="w-3 h-3" />
              Editar Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-[95%] rounded-xl">
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido</Label>
                  <Input
                    id="nickname"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="Como quer ser chamado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select
                    value={editForm.gender}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidade</Label>
                  <div className="relative">
                    <FlagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nationality"
                      className="pl-9"
                      value={editForm.nationality}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="Ex: Brasileiro"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                  className="resize-none h-20"
                />
              </div>

              <Button
                className="w-full font-bold"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { error } = await supabase
                      .from('profiles')
                      .update({
                        name: editForm.name,
                        nickname: editForm.nickname,
                        bio: editForm.bio,
                        birth_date: editForm.birth_date || null,
                        gender: editForm.gender,
                        nationality: editForm.nationality
                      })
                      .eq('user_id', user?.id);

                    if (error) throw error;

                    setProfile(prev => prev ? {
                      ...prev,
                      name: editForm.name,
                      nickname: editForm.nickname,
                      bio: editForm.bio,
                      birth_date: editForm.birth_date || null,
                      gender: editForm.gender,
                      nationality: editForm.nationality
                    } : null);

                    toast({ title: "Perfil atualizado!" });
                    setIsEditing(false);
                  } catch (error) {
                    console.error("Error updating profile:", error);
                    toast({
                      title: "Erro ao atualizar",
                      description: "Tente novamente mais tarde.",
                      variant: "destructive"
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-2 w-full mt-4">
          <div className="glass-card p-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Apelido</span>
            <span className="text-sm font-bold">{profile?.nickname || "-"}</span>
          </div>
          <div className="glass-card p-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Nacionalidade</span>
            <div className="flex items-center gap-1.5">
              {profile?.nationality && <FlagIcon className="w-3 h-3 text-primary" />}
              <span className="text-sm font-bold">{profile?.nationality || "-"}</span>
            </div>
          </div>
        </div>
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
          </div>

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
      <button
        onClick={handleSignOut}
        className="w-full glass-card p-3.5 flex items-center justify-center gap-2 text-sm font-black text-copa-live uppercase tracking-wider"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>

      <p className="text-center text-[10px] text-muted-foreground">ArenaCopa Versão 2.4.0</p>
    </div>
  );
};

export default Perfil;
