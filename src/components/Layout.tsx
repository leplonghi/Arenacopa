import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Trophy, Bell, BookOpen, ChevronLeft, User, Users2, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsSheet } from "@/components/NotificationsSheet";
import { OnboardingModal } from "@/components/OnboardingModal";
import { PWABanner } from "@/components/PWABanner";
import { FabWithPending } from "@/components/FabWithPending";
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

const logoUrl = "/logo.png?v=20260316";

const navIconMap: Record<AppNavIconKey, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  home: Home,
  championships: Trophy,
  bolao: Trophy,
  news: Newspaper,
  guia: BookOpen,
  groups: Users2,
  profile: User,
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
    <header className={cn("fixed top-0 inset-x-0 z-30 backdrop-blur-xl border-b border-white/[0.1] safe-top shadow-[0_4px_30px_rgba(0,0,0,0.6)] md:absolute md:w-full bg-[#03100a]/65", className)}>
      <div className="flex items-center justify-between px-4 h-14 md:h-16 max-w-7xl mx-auto w-full">
        {isSubpage ? (
          <button aria-label={t('actions.back')} onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary md:hidden">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-12 h-12 flex items-center justify-center p-1">
              <img src={logoUrl} alt="ArenaCup" className="h-10 w-10 object-contain" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tighter drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
              Arena<span className="text-primary italic">Cup</span>
            </span>
          </div>
        )}

        {/* Desktop Title & Mobile Subpage Title */}
        <div className="flex items-center gap-3">
          {isSubpage && (
            <button aria-label={t('actions.back')} onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary hidden md:flex">
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
            <button aria-label={t('actions.open_notifications')} className="w-10 h-10 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center relative transition-transform active:scale-95 hover:bg-secondary/80">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-copa-live rounded-full ring-2 ring-background" />
              )}
            </button>
          </NotificationsSheet>

          <NavLink to="/perfil" aria-label={t('actions.open_account')} className="md:hidden">
            <Avatar className="h-9 w-9 border border-primary/20 transition-transform active:scale-95">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {profile?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </NavLink>

          {/* Desktop Profile Menu */}
          <NavLink to="/perfil" aria-label={t('actions.open_account')} className="hidden md:block">
            <div className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-full pr-3 transition-colors">
              <Avatar className="h-9 w-9 border border-primary/20">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {profile?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{profile?.name}</span>
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
    <nav className={cn("fixed bottom-0 inset-x-0 z-30 overflow-visible backdrop-blur-xl border-t border-white/[0.1] safe-bottom shadow-[0_-4px_30px_rgba(0,0,0,0.6)] bg-[#03100a]/65", className)}>
      <div className="mx-auto grid h-[72px] max-w-md grid-cols-5 items-center px-1 overflow-visible">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return <FabWithPending key={tab.path} isActive={isNavigationItemActive(location.pathname, tab)} />;
          }
          const Icon = navIconMap[tab.iconKey];
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 text-center transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={cn("text-[10px] leading-none", isActive ? "font-bold" : "font-medium")}>{t(tab.labelKey)}</span>
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
  const location = useLocation();
  const tabs = appNavigationItems.filter((item) => item.desktop);

  return (
    <Sidebar className={cn("border-r border-white/10", className)} collapsible="icon">
      <SidebarContent className="bg-sidebar/95 backdrop-blur-xl">
        <SidebarGroup>
          <div className="p-4 flex items-center justify-center group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoUrl} alt="ArenaCup" className="h-8 w-8 object-contain" />
              </div>
              <span className="font-black text-xl tracking-tight drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                Arena<span className="text-primary">Cup</span>
              </span>
            </div>
            <div className="hidden group-data-[collapsible=icon]:flex w-full items-center justify-center">
              <img src={logoUrl} alt="ArenaCup" className="h-8 w-8 object-contain" />
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
                    className="h-12 hover:bg-white/5 active:bg-white/10 transition-colors"
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
            "flex-1 overflow-y-auto px-4 w-full max-w-7xl mx-auto scrollbar-hide flex flex-col pt-[calc(3.5rem+var(--safe-area-top,0px))] md:pt-20 pb-[calc(7.5rem+var(--safe-area-bottom,0px))] md:pb-12"
          )}>
            <div className="flex-1">
              {children}
            </div>
            <footer className="w-full border-t border-white/10 py-8 px-4 mt-12 shrink-0">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between md:gap-4 text-xs text-muted-foreground gap-4">
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt="ArenaCup" className="h-4 w-4 opacity-50" />
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
