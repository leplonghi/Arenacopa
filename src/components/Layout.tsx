import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Trophy, Bell, ChevronLeft, User, Users2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsSheet } from "@/components/NotificationsSheet";
import { OnboardingModal } from "@/components/OnboardingModal";
import { PWABanner } from "@/components/PWABanner";
import { FabWithPending } from "@/components/FabWithPending";
import { MobileMenuSheet } from "@/components/MobileMenuSheet";
import { BrandWordmark } from "@/components/BrandWordmark";
import {
  ChampionshipBadgeIcon,
  CupTrophyIcon,
  HomeArenaIcon,
  NewsPulseIcon,
} from "@/components/AppNavIcons";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

import { useTranslation } from "react-i18next";
import { getProfile } from "@/services/profile/profile.service";
import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "@/services/notifications/notifications.service";
import { appNavigationItems, isNavigationItemActive, type AppNavIconKey } from "@/config/navigation";
import { useProfileStats } from "@/hooks/useProfileStats";
import { getArenaLevel } from "@/lib/profile-level";

const logoUrl = "/logo.png?v=20260316";

const navIconMap: Record<AppNavIconKey, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  home: HomeArenaIcon,
  copa: CupTrophyIcon,
  championships: ChampionshipBadgeIcon,
  bolao: Trophy,
  news: NewsPulseIcon,
  guia: NewsPulseIcon,
  groups: Users2,
  profile: User,
  menu: Menu,
};

function Header({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSubpage = location.pathname.split("/").filter(Boolean).length > 1;

  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const profileData = await getProfile(user.id);
        if (profileData) {
          setProfile({ name: profileData.name, avatar: profileData.avatar_url || undefined });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  const { t } = useTranslation('common');
  const brandName = t('brand.name');

  const { data: rawNotifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await listNotifications(user.id);
      } catch {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60_000,
  });
  const unreadCount = (rawNotifications as Array<{ read: boolean }>).filter(n => !n.read).length;
  const { data: stats } = useProfileStats(user?.id);
  const levelInfo = useMemo(() => getArenaLevel(stats?.points), [stats?.points]);

  const getTitle = () => {
    const path = location.pathname;
    // Remove locale prefix if present to match paths logic (simpler for now until we use useLocalePath fully)
    // Actually we will handle this better in Phase 5. For now, strings match current routing.

    if (path === "/") return null;
    if (path.startsWith("/copa")) return null;
    if (path === "/campeonatos") return null;
    if (path.startsWith("/campeonato/")) return null;
    if (path.startsWith("/guia")) return null;
    if (path === "/ranking") return null;
    if (path === "/noticias") return null;
    if (path === "/boloes") return t('header.titles.boloes');
    if (path === "/boloes/criar") return t('header.titles.create_bolao');
    if (path.startsWith("/boloes/")) return t('header.titles.bolao_detail');
    if (path === "/grupos") return t('header.titles.groups');
    if (path.startsWith("/grupos/")) return t('header.titles.group_detail');
    if (path === "/perfil") return t('header.titles.profile');
    return null;
  };

  const title = getTitle();

  return (
    <header className={cn("fixed inset-x-0 top-0 z-30 safe-top", className)}>
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4">
        {isSubpage ? (
          <button
            aria-label={t('actions.back')}
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/90 backdrop-blur-xl md:hidden"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : (
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-14 w-14 items-center justify-center">
              <img src={logoUrl} alt={brandName} className="h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(255,196,0,0.22)]" />
            </div>
            <BrandWordmark
              label={brandName}
              className="font-display text-[2rem] font-black tracking-[0.01em] text-white"
            />
          </div>
        )}

        {/* Desktop Title & Mobile Subpage Title */}
        <div className="flex items-center gap-3">
          {isSubpage && (
            <button aria-label={t('actions.back')} onClick={() => navigate(-1)} className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/90 backdrop-blur-xl md:flex">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {title && (
            <h1 className={cn(
              "font-bold transition-all",
              isSubpage
                ? "text-base absolute left-1/2 -translate-x-1/2 md:relative md:left-0 md:translate-x-0 md:text-lg"
                : "text-lg hidden md:block"
            )}>
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NotificationsSheet>
            <button aria-label={t('actions.open_notifications')} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition-transform active:scale-95">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-[#02100b]" />
              )}
            </button>
          </NotificationsSheet>

          <NavLink to="/perfil" aria-label={t('actions.open_account')} className="md:hidden">
            <div className="relative transition-transform active:scale-95">
              <Avatar className="arena-glow-ring h-14 w-14 border-[3px] border-[#7dff48]/35 bg-[#05140d]">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-black">
                  {profile?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#02100b] bg-primary font-display text-sm font-black text-black">
                {levelInfo.level}
              </span>
            </div>
          </NavLink>

          {/* Desktop Profile Menu */}
          <NavLink to="/perfil" aria-label={t('actions.open_account')} className="hidden md:block">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 p-1 pr-3 transition-colors hover:bg-white/5">
              <Avatar className="arena-glow-ring h-10 w-10 border-[3px] border-[#7dff48]/35 bg-[#05140d]">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {profile?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{profile?.name}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-xs font-black text-black">
                {levelInfo.level}
              </span>
            </div>
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function BottomTabs({ className }: { className?: string }) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const tabs = appNavigationItems.filter((item) => item.mobile);

  return (
    <nav className={cn("fixed bottom-0 inset-x-0 z-30 overflow-visible safe-bottom", className)}>
      <div
        className="mx-auto grid h-[88px] max-w-md items-end overflow-visible rounded-t-[28px] border border-b-0 border-[#3b5b4d] bg-[linear-gradient(180deg,rgba(5,19,14,0.98)_0%,rgba(3,12,9,1)_100%)] px-2 pb-3 pt-2 shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.9)]"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          if (tab.isFab) {
            return <FabWithPending key={tab.path} isActive={isNavigationItemActive(location.pathname, tab)} />;
          }
          const Icon = navIconMap[tab.iconKey];
          if (tab.path === "#menu") {
            return (
              <MobileMenuSheet key={tab.path}>
                <button className="flex h-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[22px] px-1 py-2 text-center text-zinc-300 transition-colors outline-none">
                  <span className="relative flex h-8 w-8 items-center justify-center scale-[0.96] transition-all duration-300">
                    <span className="absolute inset-0 rounded-[14px] border transition-all duration-300 border-transparent bg-transparent" />
                    <Icon className="relative z-10 h-[22px] w-[22px]" strokeWidth={1.72} />
                  </span>
                  <span className="font-display text-[13px] leading-none">{t(tab.labelKey)}</span>
                </button>
              </MobileMenuSheet>
            );
          }
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex h-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[22px] px-1 py-2 text-center transition-colors",
                  isActive ? "text-primary" : "text-zinc-300"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center transition-all duration-300",
                      isActive ? "scale-100" : "scale-[0.96]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-0 rounded-[14px] border transition-all duration-300",
                        isActive
                          ? "border-primary/40 bg-primary/10 shadow-[0_0_18px_rgba(255,198,0,0.14)]"
                          : "border-transparent bg-transparent"
                      )}
                    />
                    <Icon className="relative z-10 h-[22px] w-[22px]" strokeWidth={isActive ? 2.05 : 1.72} />
                  </span>
                  <span className={cn("font-display text-[13px] leading-none", isActive ? "font-black" : "font-semibold")}>{t(tab.labelKey)}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function AppSidebar({ className }: { className?: string }) {
  const { t } = useTranslation('common');
  const brandName = t('brand.name');
  const location = useLocation();
  const tabs = appNavigationItems.filter((item) => item.desktop);

  return (
    <Sidebar className={cn("border-r border-white/10", className)} collapsible="icon">
      <SidebarContent className="bg-[linear-gradient(180deg,rgba(4,17,13,0.96)_0%,rgba(2,9,7,0.98)_100%)] backdrop-blur-xl">
        <SidebarGroup>
          <div className="p-4 flex items-center justify-center group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoUrl} alt={brandName} className="h-8 w-8 object-contain" />
              </div>
              <BrandWordmark
                label={brandName}
                className="font-display text-[1.9rem] font-black tracking-[0.01em] text-white"
              />
            </div>
            <div className="hidden group-data-[collapsible=icon]:flex w-full items-center justify-center">
              <img src={logoUrl} alt={brandName} className="h-8 w-8 object-contain" />
            </div>
          </div>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {tabs.map((tab) => {
                const Icon = navIconMap[tab.iconKey];
                const isActive = isNavigationItemActive(location.pathname, tab);
                return (
                <SidebarMenuItem key={tab.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    tooltip={t(tab.labelKey)}
                    className="h-12 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    <NavLink to={tab.path}>
                      <Icon className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-medium">{t(tab.labelKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

import { CookieBanner } from "@/components/CookieBanner";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideBottomNav = location.pathname === "/boloes/criar";
  const { user } = useAuth();
  const { t } = useTranslation('common');

  return (
    <SidebarProvider>
      <CookieBanner />
      <OnboardingModal />
      <div className="flex min-h-screen w-full bg-transparent">
        <AppSidebar className="hidden md:flex z-40" />
        <SidebarInset className="bg-transparent flex flex-col h-svh w-full overflow-hidden">
          <Header className="w-full shrink-0" />
          <main className={cn(
            "flex-1 overflow-y-auto w-full max-w-7xl mx-auto scrollbar-hide flex flex-col pt-[calc(4.6rem+var(--safe-area-top,0px))] md:pt-20 pb-[calc(8.5rem+var(--safe-area-bottom,0px))] md:pb-12"
          )}>
            <div className="flex-1">
              {children}
            </div>
            <footer className="mt-12 w-full shrink-0 border-t border-white/10 px-4 py-8">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between md:gap-4 text-xs text-muted-foreground gap-4">
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt={t('brand.name')} className="h-4 w-4 opacity-50" />
                  <span>{t('footer.rights')}</span>
                </div>
                <div className="flex gap-6">
                  <NavLink to="/termos" className="hover:text-primary transition-colors">{t('footer.terms')}</NavLink>
                  <NavLink to="/privacidade" className="hover:text-primary transition-colors">{t('footer.privacy')}</NavLink>
                  <a href="mailto:contato@arenacup.com" className="hover:text-primary transition-colors">{t('footer.contact')}</a>
                </div>
              </div>
            </footer>
          </main>
          {!hideBottomNav && <BottomTabs className="md:hidden" />}
        </SidebarInset>
      </div>
      <PWABanner />
    </SidebarProvider>
  );
}
