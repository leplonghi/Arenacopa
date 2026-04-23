import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { teams, getTeam } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Bell, Sparkles, Goal, Newspaper, Clock, Loader2, Languages, Target, Star, Crown, Zap, Trophy, Medal, Award, Heart, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/useLanguage";
import { useProfileStats } from "@/hooks/useProfileStats";
import { deleteDoc, doc, setDoc } from "firebase/firestore";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag as FlagIcon } from "lucide-react";
import { getProfile, updateFavoriteTeam, updateProfile, uploadAvatar } from "@/services/profile/profile.service";
import type { ProfileRecord } from "@/services/profile/profile.types";
import { setStoredFavoriteTeam } from "@/lib/favorite-team";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { getArenaLevel } from "@/lib/profile-level";
import { AchievementRail } from "@/components/profile/AchievementRail";
import { HistoryStatList } from "@/components/profile/HistoryStatList";

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

function getPushSubscriptionDocId(userId: string, endpoint: string) {
  return `${userId}_${encodeURIComponent(endpoint)}`;
}

const Perfil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('profile');
  const { language, systemLanguage } = useLanguage();
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

  const { data: stats } = useProfileStats(user?.id);

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
    setStoredFavoriteTeam(code);
  };

  /* Safe access to team with fallback */
  const favoriteTeam = profile?.favorite_team || localStorage.getItem("favorite_team") || "BRA";
  const team = getTeam(favoriteTeam) || getTeam("BRA") || teams[0];
  const displayName = profile?.name || user?.email?.split("@")[0] || t('default_user_name');
  const initials = displayName.slice(0, 2).toUpperCase();
  const levelInfo = getArenaLevel(stats?.points);
  const achievements = [
    { id: "primeiro_palpite", title: t('achievements.first_prediction.title'), description: (stats?.totalPredictions || 0) > 0 ? t('achievements.first_prediction.desc') : t('achievements.locked'), icon: <Goal className="w-6 h-6" />, unlocked: (stats?.totalPredictions || 0) > 0 },
    { id: "placar_exato", title: t('achievements.exact_score.title'), description: (stats?.exactScores || 0) > 0 ? t('achievements.exact_score.desc') : t('achievements.locked'), icon: <Target className="w-6 h-6 text-blue-400" />, unlocked: (stats?.exactScores || 0) > 0 },
    { id: "criador_bolao", title: t('achievements.pool_creator.title'), description: (stats?.createdBoloes || 0) > 0 ? t('achievements.pool_creator.desc') : t('achievements.locked'), icon: <Crown className="w-6 h-6 text-amber-500" />, unlocked: (stats?.createdBoloes || 0) > 0 },
    { id: "combo_3", title: t('achievements.combo_three.title'), description: (stats?.exactScores || 0) >= 3 ? t('achievements.combo_three.desc') : t('achievements.locked'), icon: <Zap className="w-6 h-6 text-violet-400" />, unlocked: (stats?.exactScores || 0) >= 3 },
    { id: "campeao", title: t('achievements.champion.title'), description: (stats?.titles || 0) > 0 ? t('achievements.champion.desc') : t('achievements.locked'), icon: <Trophy className="w-6 h-6 text-emerald-400" />, unlocked: (stats?.titles || 0) > 0 },
  ];
  const historyItems = [
    { label: "Palpites enviados", value: (stats?.totalPredictions || 0).toLocaleString("pt-BR") },
    { label: "Placares exatos", value: (stats?.exactScores || 0).toLocaleString("pt-BR") },
    { label: "Bolões criados", value: (stats?.createdBoloes || 0).toLocaleString("pt-BR") },
    { label: "Títulos", value: (stats?.titles || 0).toLocaleString("pt-BR") },
    { label: "Aproveitamento", value: `${stats?.efficiency || 0}%` },
  ];
  const languageLabels = {
    "pt-BR": t('language_names.ptBR'),
    en: t('language_names.en'),
    es: t('language_names.es'),
  } as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="arena-screen space-y-6">
      <ArenaPanel tone="strong" className="p-6">
        <div className="grid gap-6 md:grid-cols-[auto,1fr,auto] md:items-start">
          <div className="relative mx-auto md:mx-0">
            <label className="arena-glow-ring group relative block h-32 w-32 overflow-hidden rounded-full border-[4px] border-primary/35 bg-[#07150f] cursor-pointer">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-black text-primary">
                  {initials}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] font-bold uppercase tracking-[0.12em] text-white opacity-0 transition group-hover:opacity-100">
                {t('upload_photo')}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;

                  try {
                    toast({ title: t('common:common.loading'), description: t('avatar_uploading') });
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
            <span className="absolute -bottom-2 right-0 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#06150f] bg-primary font-display text-xl font-black text-black">
              {levelInfo.level}
            </span>
          </div>

          <div className="space-y-3 text-center md:text-left">
            <p className="arena-kicker text-primary">Perfil</p>
            <h1 className="font-display text-[3.2rem] font-black uppercase leading-[0.9] text-white">
              {displayName}
            </h1>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/12 px-4 py-2 text-primary">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-display text-xl font-black uppercase">
                Nível {levelInfo.level} • Apostador
              </span>
            </div>
            <p className="text-2xl font-black text-zinc-200">
              {levelInfo.currentXp} / {levelInfo.maxXp} XP
            </p>
            <div className="arena-progress max-w-xl">
              <span style={{ width: `${Math.max(8, Math.min(100, levelInfo.ratio * 100))}%` }} />
            </div>
            <p className="text-sm text-zinc-400">{user?.email}</p>
          </div>

          <div className="flex justify-center md:justify-end">
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
                <button className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition hover:text-white">
                  <Settings className="h-6 w-6" />
                </button>
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
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <ArenaMetric label={t('stat_total_points')} value={(stats?.points || 0).toLocaleString("pt-BR")} accent />
          <ArenaMetric label={t('stat_efficiency')} value={`${stats?.efficiency || 0}%`} />
          <ArenaMetric label={t('stat_titles')} value={stats?.titles || 0} />
          <ArenaMetric label={t('stat_exact_scores')} value={stats?.exactScores || 0} />
        </div>
      </ArenaPanel>

      <ArenaPanel className="p-5">
        <ArenaSectionHeader
          eyebrow="Identidade"
          title="Resumo do perfil"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ArenaMetric label={t('nickname')} value={profile?.nickname || "-"} />
          <ArenaMetric
            label={t('nationality')}
            value={
              <span className="inline-flex items-center gap-2">
                {profile?.nationality ? <FlagIcon className="h-4 w-4 text-primary" /> : null}
                {profile?.nationality || "-"}
              </span>
            }
          />
          <ArenaMetric label="Palpites" value={(stats?.totalPredictions || 0).toLocaleString("pt-BR")} />
        </div>
      </ArenaPanel>

      <ArenaPanel className="p-5">
        <ArenaSectionHeader
          eyebrow={t('performance_title')}
          title={t('achievements_title')}
          action={<button className="text-sm font-black uppercase tracking-[0.12em] text-primary">Ver todas</button>}
        />
        <div className="mt-5">
          <AchievementRail items={achievements} />
        </div>
      </ArenaPanel>

      <ArenaPanel className="p-5">
        <ArenaSectionHeader
          eyebrow="Histórico"
          title="Seu desempenho acumulado"
        />
        <div className="mt-5">
          <HistoryStatList items={historyItems} />
        </div>
      </ArenaPanel>

      {/* My Team */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t('my_team')}</h3>
          </div>
          <button
            onClick={() => setShowTeamPicker(!showTeamPicker)}
            aria-expanded={showTeamPicker}
            className="text-sm text-primary font-semibold"
          >
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
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground block mb-2">{t('quick_switch')}</span>
            <div className="flex gap-2">
              {teams.slice(0, 4).map((teamOption) => (
                <button
                  key={teamOption.code}
                  onClick={() => setFavoriteTeam(teamOption.code)}
                  aria-label={t('favorite_team.select_aria', { team: teamOption.name })}
                  className={cn(
                    "w-11 h-11 rounded-full overflow-hidden transition-all",
                    favoriteTeam === teamOption.code && "ring-2 ring-primary"
                  )}
                >
                  <Flag code={teamOption.code} size="md" className="w-11 h-11" />
                </button>
              ))}
              <button
                onClick={() => setShowTeamPicker(true)}
                aria-label={t('favorite_team.open_selector_aria')}
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
              {teams.map((teamOption) => (
                <button
                  key={teamOption.code}
                  onClick={() => {
                    setFavoriteTeam(teamOption.code);
                    setShowTeamPicker(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors",
                    favoriteTeam === teamOption.code ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-secondary"
                  )}
                >
                  <Flag code={teamOption.code} size="sm" />
                  <span className="text-[10px] font-bold">{teamOption.code}</span>
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
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t('language')}</h3>
        </div>
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">{t('language_auto')}</p>
              <p className="text-sm font-semibold text-white">{t('language_following_system')}</p>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
              {languageLabels[language]}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('language_system', { language: languageLabels[systemLanguage] })}
          </p>
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
          aria-pressed={Boolean(profile?.fun_mode)}
          aria-label={profile?.fun_mode ? t('fun_mode_disable') : t('fun_mode_enable')}
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
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-copa-gold">{t('premium_title')}</h3>
        </div>
        <button
          type="button"
          aria-label={t('premium_open_aria')}
          onClick={() => navigate('/premium')}
          className="relative glass-card p-5 border-copa-gold/30 hover:border-copa-gold/60 transition-colors overflow-hidden group cursor-pointer w-full text-left"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-copa-gold/10 rounded-full blur-2xl group-hover:bg-copa-gold/20 transition-colors"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h4 className="font-black text-lg text-white mb-1">{t('premium_card_title')}</h4>
              <p className="text-[13px] text-muted-foreground w-4/5">{t('premium_card_desc')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-copa-gold/10 flex items-center justify-center shrink-0 border border-copa-gold/30 text-copa-gold group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-copa-gold" />
            </div>
          </div>
        </button>
      </section>

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t('notifications_title')}</h3>
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
                <span className="text-[11px] text-muted-foreground">{n.desc}</span>
              </div>
              <button
                onClick={async () => {
                  if (!user?.id) return;

                  const targetState = !profile?.[n.key];

                  if (n.key === "notifications_goals" && targetState) {
                    if (!("Notification" in window)) {
                      toast({ title: t('bolao:common.error_title'), description: t('browser_notifications_unsupported'), variant: "destructive" });
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
                          await setDoc(doc(db, 'push_subscriptions', getPushSubscriptionDocId(user.id, subscription.endpoint)), {
                            user_id: user.id,
                            endpoint: subscription.endpoint,
                            auth: subData.keys?.auth,
                            p256dh: subData.keys?.p256dh,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          }, { merge: true });
                        }
                      } catch (e) {
                        console.error("Push sub error", e);
                      }
                    } else {
                      toast({ title: t('notifications_denied_title'), description: t('notifications_denied_desc'), variant: "destructive" });
                      return; // Do not turn it on if denied
                    }
                  } else if (n.key === "notifications_goals" && !targetState) {
                      try {
                        // Remove sub when disabling
                        const registration = await navigator.serviceWorker.ready;
                        const subscription = await registration.pushManager.getSubscription();
                        if (subscription) {
                          await subscription.unsubscribe();
                          await deleteDoc(doc(db, 'push_subscriptions', getPushSubscriptionDocId(user.id, subscription.endpoint)));
                        }
                      } catch (e) {
                        console.error("Push unsub error", e);
                    }
                  }

                  setProfile(prev => prev ? { ...prev, [n.key]: targetState } : null);
                  await updateProfile(user.id, { [n.key]: targetState });
                }}
                aria-pressed={Boolean(profile?.[n.key])}
                aria-label={`${profile?.[n.key] ? "Desativar" : "Ativar"} ${n.label}`}
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

      {/* Apoie o Arena CUP */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Heart className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t('support_title')}</h3>
        </div>
        <div className="glass-card p-4 text-center space-y-3">
          <p className="text-[12px] text-muted-foreground">{t('support_desc')}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText("suporte@arenacup.com"); // Reemplazar con clave PIX real
              toast({ title: t('support_copied_title'), description: t('support_copied_desc') });
            }}
            className="w-full bg-copa-live/10 text-copa-live border border-copa-live/20 font-bold text-sm py-2.5 rounded-xl hover:bg-copa-live/20 transition-colors flex items-center justify-center gap-2"
          >
            {t('support_action')}
          </button>
        </div>
      </section>

      {/* Informações Legais */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t('help_title')}</h3>
        </div>
        <div className="glass-card divide-y divide-border/30 flex flex-col">
          <button onClick={() => navigate('/regras')} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">{t('help_rules')}</button>
          <button onClick={() => navigate('/termos')} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">{t('help_terms')}</button>
          <button onClick={() => navigate('/privacidade')} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">{t('help_privacy')}</button>
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
