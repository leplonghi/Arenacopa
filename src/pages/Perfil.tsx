import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { teams, getTeam } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Bell, Sparkles, Goal, Newspaper, Clock, Loader2, Languages, Target, Star, Crown, Zap, Trophy, Medal, Award, Heart, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag as FlagIcon } from "lucide-react";
import { getProfile, updateFavoriteTeam, updateProfile, uploadAvatar } from "@/services/profile/profile.service";
import type { ProfileRecord } from "@/services/profile/profile.types";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const Perfil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('profile');
  const { language, changeLanguage } = useLanguage();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    nickname: "",
    bio: "",
    birth_date: "",
    gender: "",
    nationality: ""
  });
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setEditForm({
          name: data.name || "",
          nickname: data.nickname || "",
          bio: data.bio || "",
          birth_date: data.birth_date || "",
          gender: data.gender || "",
          nationality: data.nationality || ""
        });
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const setFavoriteTeam = async (code: string) => {
    setProfile(prev => prev ? { ...prev, favorite_team: code } : null);
    if (user?.id) {
      await updateFavoriteTeam(user.id, code);
    }
    localStorage.setItem("favorite_team", code);
  };

  /* Safe access to team with fallback */
  const favoriteTeam = profile?.favorite_team || localStorage.getItem("favorite_team") || "BRA";
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
    <div className="px-4 py-4 space-y-6">
      {/* Profile header */}
      <div className="flex flex-col items-center pt-4 pb-2">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-copa-green to-copa-green-light flex items-center justify-center text-3xl font-black mb-3 border-4 border-primary/20 relative group cursor-pointer overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}

          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-[10px] font-bold text-white uppercase">{t('upload_photo')}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;

                try {
                  toast({ title: "Enviando...", description: "Atualizando sua foto de perfil." });
                  const publicUrl = await uploadAvatar(user.id, file);

                  setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
                  toast({ title: t('bolao:create_bolao.notification.created_title'), description: t('avatar_success') });
                } catch (error) {
                  console.error('Error uploading avatar:', error);
                  toast({ title: t('bolao:common.error_title'), description: t('bolao:common.error_desc'), variant: "destructive" });
                }
              }}
            />
          </label>
        </div>
        <h2 className="text-xl font-black">{displayName}</h2>
        <span className="text-xs text-muted-foreground">{user?.email}</span>

        <Dialog
          open={isEditing}
          onOpenChange={(open) => {
            setIsEditing(open);
            if (open && profile) {
              setEditForm({
                name: profile.name || "",
                nickname: profile.nickname || "",
                bio: profile.bio || "",
                birth_date: profile.birth_date || "",
                gender: profile.gender || "",
                nationality: profile.nationality || ""
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-3 h-7 text-xs gap-1.5">
              <Settings className="w-3 h-3" />
              {t('edit')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-[95%] rounded-xl">
            <DialogHeader>
              <DialogTitle>{t('edit_modal_title')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('full_name')}</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">{t('nickname')}</Label>
                  <Input
                    id="nickname"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder={t('nickname_placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">{t('birth_date')}</Label>
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
                  <Label>{t('gender')}</Label>
                  <Select
                    value={editForm.gender}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('gender_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">{t('gender_male')}</SelectItem>
                      <SelectItem value="feminino">{t('gender_female')}</SelectItem>
                      <SelectItem value="outro">{t('gender_other')}</SelectItem>
                      <SelectItem value="prefiro_nao_dizer">{t('gender_none')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">{t('nationality')}</Label>
                  <div className="relative">
                    <FlagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nationality"
                      className="pl-9"
                      value={editForm.nationality}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder={t('nationality_placeholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t('bio')}</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('bio_placeholder')}
                  className="resize-none h-20"
                />
              </div>

              <Button
                className="w-full font-bold"
                onClick={async () => {
                  try {
                    setLoading(true);
                    if (!user?.id) throw new Error("No user");
                    const updateData = {
                      name: editForm.name,
                      nickname: editForm.nickname,
                      bio: editForm.bio,
                      birth_date: editForm.birth_date || null,
                      gender: editForm.gender,
                      nationality: editForm.nationality
                    };
                    await updateProfile(user.id, updateData);

                    setProfile(prev => prev ? {
                      ...prev,
                      name: editForm.name,
                      nickname: editForm.nickname,
                      bio: editForm.bio,
                      birth_date: editForm.birth_date || null,
                      gender: editForm.gender,
                      nationality: editForm.nationality
                    } : null);

                    toast({ title: t('update_success') });
                    setIsEditing(false);
                  } catch (error) {
                    console.error("Error updating profile:", error);
                    toast({
                      title: t('bolao:common.error_title'),
                      description: t('bolao:common.error_desc'),
                      variant: "destructive"
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {t('save_changes')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-2 w-full mt-4">
          <div className="glass-card p-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('nickname')}</span>
            <span className="text-sm font-bold">{profile?.nickname || "-"}</span>
          </div>
          <div className="glass-card p-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('nationality')}</span>
            <div className="flex items-center gap-1.5">
              {profile?.nationality && <FlagIcon className="w-3 h-3 text-primary" />}
              <span className="text-sm font-bold">{profile?.nationality || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification / Statistics & Achievements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Desempenho da Lenda</h3>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total de Pontos</p>
              <h4 className="text-2xl font-black text-white leading-none">1,450</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Star className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Aproveitamento</p>
              <h4 className="text-2xl font-black text-white leading-none">68%</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Placares Exatos</p>
              <h4 className="text-2xl font-black text-white leading-none">12</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Goal className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Títulos</p>
              <h4 className="text-2xl font-black text-white leading-none">1</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Achievements Horizontal Scroll */}
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] px-1">Conquistas Desbloqueadas</p>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {[
              { id: "primeiro_palpite", title: "Chute Inicial", desc: "Deu seu primeiro palpite", icon: <Goal className="w-6 h-6 text-primary" />, color: "primary", unlocked: true },
              { id: "placar_exato", title: "Na Mosca", desc: "Acertou 1 placar exato", icon: <Target className="w-6 h-6 text-blue-400" />, color: "blue-500", unlocked: true },
              { id: "criador_bolao", title: "Líder nato", desc: "Criou um bolão", icon: <Crown className="w-6 h-6 text-amber-500" />, color: "amber-500", unlocked: true },
              { id: "combo_3", title: "Hat-trick", desc: "Acertou 3 exatos seguidos", icon: <Zap className="w-6 h-6 text-violet-400" />, color: "violet-400", unlocked: false },
              { id: "campeao", title: "Campeão", desc: "Venceu um bolão inteiro", icon: <Trophy className="w-6 h-6 text-emerald-400" />, color: "emerald-400", unlocked: false },
            ].map(ach => (
              <div
                key={ach.id}
                className={cn(
                  "snap-center shrink-0 w-[140px] p-4 rounded-3xl border flex flex-col items-center justify-center text-center transition-all",
                  ach.unlocked
                    ? `bg-${ach.color}/5 border-${ach.color}/20 shadow-[0_0_15px_rgba(var(--${ach.color}-rgb),0.1)]`
                    : "bg-white/[0.02] border-white/5 opacity-50 grayscale"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-[16px] flex items-center justify-center mb-3",
                  ach.unlocked ? `bg-${ach.color}/10` : "bg-white/5"
                )}>
                  {ach.icon}
                </div>
                <span className="text-xs font-black text-white mb-1 leading-tight">{ach.title}</span>
                <span className="text-[9px] text-gray-400 font-medium leading-tight">{ach.unlocked ? ach.desc : "Bloqueado"}</span>
              </div>
            ))}
            {/* spacer for scroll */}
            <div className="snap-center shrink-0 w-2" />
          </div>
        </div>
      </section>

      {/* My Team */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('my_team')}</h3>
          </div>
          <button onClick={() => setShowTeamPicker(!showTeamPicker)} className="text-xs text-primary font-semibold">
            {t('edit_team')}
          </button>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <Flag code={team.code} size="xl" className="border-2 border-copa-green/30" />
            <div>
              <h4 className="text-base font-black">{team.name}</h4>
              <span className="text-xs text-muted-foreground">{t('bolao:common.group')} {team.group}</span>
            </div>
          </div>

          <div className="pt-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">{t('quick_switch')}</span>
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

      {/* Language Selection */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Languages className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('language')}</h3>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{t('language_choose')}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'pt-BR' as const, name: 'Português', flag: 'BRA' },
              { code: 'en' as const, name: 'English', flag: 'USA' },
              { code: 'es' as const, name: 'Español', flag: 'ESP' }
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border",
                  language === lang.code
                    ? "bg-primary/20 border-primary ring-1 ring-primary"
                    : "bg-secondary/40 border-border/50 hover:bg-secondary"
                )}
              >
                <Flag code={lang.flag} size="sm" />
                <span className="text-[10px] font-bold">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Fun Mode */}
      <div className="rounded-xl bg-gradient-to-r from-primary/80 to-primary p-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-black">{t('fun_mode')}</span>
          </div>
          <p className="text-[11px] text-primary-foreground/80 leading-relaxed">
            {t('fun_mode_desc')}
          </p>
        </div>
        <button
          onClick={async () => {
            const newVal = !profile?.fun_mode;
            setProfile(prev => prev ? { ...prev, fun_mode: newVal } : null);
            if (user?.id) {
              await updateProfile(user.id, { fun_mode: newVal });
            }
          }}
          className={cn(
            "w-12 h-7 rounded-full transition-colors relative shrink-0",
            profile?.fun_mode ? "bg-background/30" : "bg-background/10"
          )}
        >
          <span className={cn(
            "absolute top-1 w-5 h-5 rounded-full bg-foreground shadow transition-transform",
            profile?.fun_mode ? "left-6" : "left-1"
          )} />
        </button>
      </div>

      {/* Copa Premium */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Crown className="w-3.5 h-3.5 text-copa-gold" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-copa-gold">Copa Premium</h3>
        </div>
        <div className="relative glass-card p-5 border-copa-gold/30 hover:border-copa-gold/60 transition-colors overflow-hidden group cursor-pointer" onClick={() => navigate('/premium')}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-copa-gold/10 rounded-full blur-2xl group-hover:bg-copa-gold/20 transition-colors"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h4 className="font-black text-lg text-white mb-1">Desbloqueie o ArenaCopa</h4>
              <p className="text-xs text-muted-foreground w-4/5">Bolões ilimitados, sem anúncios e badge exclusivo.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-copa-gold/10 flex items-center justify-center shrink-0 border border-copa-gold/30 text-copa-gold group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-copa-gold" />
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('notifications_title')}</h3>
        </div>
        <div className="glass-card divide-y divide-border/30">
          {[
            { key: "notifications_goals" as const, icon: Goal, label: t('goals_notif'), desc: t('goals_notif_desc') },
            { key: "notifications_news" as const, icon: Newspaper, label: t('news_notif'), desc: t('news_notif_desc') },
            { key: "notifications_match_start" as const, icon: Clock, label: t('match_start_notif'), desc: t('match_start_notif_desc') },
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
                onClick={async () => {
                  if (!user?.id) return;

                  const targetState = !profile?.[n.key];

                  if (n.key === "notifications_goals" && targetState) {
                    if (!("Notification" in window)) {
                      toast({ title: t('bolao:common.error_title'), description: "Seu navegador não suporta notificações", variant: "destructive" });
                      return;
                    }

                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                      try {
                        const registration = await navigator.serviceWorker.ready;
                        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                        let subscription = await registration.pushManager.getSubscription();

                        if (!subscription && vapidKey) {
                          const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
                          subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey
                          });
                        }

                        if (subscription) {
                          const subData = JSON.parse(JSON.stringify(subscription));
                          await supabase.from('push_subscriptions').upsert({
                            user_id: user.id,
                            endpoint: subscription.endpoint,
                            auth: subData.keys?.auth,
                            p256dh: subData.keys?.p256dh
                          }, { onConflict: 'user_id,endpoint' });
                        }
                      } catch (e) {
                        console.error("Push sub error", e);
                      }
                    } else {
                      toast({ title: "Permissão negada", description: "Ative as notificações do navegador para receber alertas de gol", variant: "destructive" });
                      return; // Do not turn it on if denied
                    }
                  } else if (n.key === "notifications_goals" && !targetState) {
                    try {
                      // Remove sub when disabling
                      const registration = await navigator.serviceWorker.ready;
                      const subscription = await registration.pushManager.getSubscription();
                      if (subscription) {
                        await subscription.unsubscribe();
                        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
                      }
                    } catch (e) {
                      console.error("Push unsub error", e);
                    }
                  }

                  setProfile(prev => prev ? { ...prev, [n.key]: targetState } : null);
                  await updateProfile(user.id, { [n.key]: targetState });
                }}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative shrink-0",
                  profile?.[n.key] ? "bg-primary" : "bg-secondary"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-foreground shadow transition-transform",
                  profile?.[n.key] ? "left-6" : "left-1"
                )} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Apoie o ArenaCopa */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Heart className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Apoie o ArenaCopa</h3>
        </div>
        <div className="glass-card p-4 text-center space-y-3">
          <p className="text-[11px] text-muted-foreground">O app é grátis! Se curtiu, considere apoiar o desenvolvimento.</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText("suporte@arenacopa.com"); // Reemplazar con clave PIX real
              toast({ title: "Chave copiada!", description: "A chave PIX foi copiada para sua área de transferência." });
            }}
            className="w-full bg-copa-live/10 text-copa-live border border-copa-live/20 font-bold text-sm py-2.5 rounded-xl hover:bg-copa-live/20 transition-colors flex items-center justify-center gap-2"
          >
            Fazer PIX
          </button>
        </div>
      </section>

      {/* Informações Legais */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Informações Legais</h3>
        </div>
        <div className="glass-card divide-y divide-border/30 flex flex-col">
          <button onClick={() => navigate('/termos')} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">Termos de Uso</button>
          <button onClick={() => navigate('/privacidade')} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">Política de Privacidade</button>
        </div>
      </section>

      {/* Logout */}
      <button
        onClick={handleSignOut}
        className="w-full glass-card p-3.5 flex items-center justify-center gap-2 text-sm font-black text-copa-live uppercase tracking-wider"
      >
        <LogOut className="w-4 h-4" />
        {t('logout')}
      </button>

      <p className="text-center text-[10px] text-muted-foreground">{t('version')} 2.4.0</p>
    </div>
  );
};

export default Perfil;
