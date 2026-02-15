import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Trophy, BarChart2, Bell, ChevronLeft, Dices, Compass, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsSheet } from "@/components/NotificationsSheet";
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

const defaultLogo = "/logo.png";


function Header({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSubpage = location.pathname.split("/").filter(Boolean).length > 1;

  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState(defaultLogo);

  useEffect(() => {
    // Check for logo in storage
    supabase.storage.from('assets').list('', { search: 'logo.png' }).then(({ data }) => {
      if (data && data.length > 0) {
        const { data: publicData } = supabase.storage.from('assets').getPublicUrl('logo.png');
        setLogoUrl(publicData.publicUrl);
      }
    });

    if (!user) return;

    const fetchProfile = async () => {
      // Demo Mode Check
      const isDemo = localStorage.getItem("demo_mode") === "true";
      if (isDemo) {
        setProfile({ name: "Demo User", avatar: "https://github.com/shadcn.png" });
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile({ name: profileData.name, avatar: profileData.avatar_url });
      }
    };

    fetchProfile();
  }, [user]);

  const { t } = useTranslation('common');

  const getTitle = () => {
    const path = location.pathname;
    // Remove locale prefix if present to match paths logic (simpler for now until we use useLocalePath fully)
    // Actually we will handle this better in Phase 5. For now, strings match current routing.

    if (path === "/") return null;
    if (path.startsWith("/copa")) return null;
    if (path.startsWith("/guia")) return null;
    if (path === "/ranking") return null;
    if (path === "/boloes") return t('header.titles.boloes');
    if (path === "/boloes/criar") return t('header.titles.create_bolao');
    if (path.startsWith("/boloes/")) return t('header.titles.bolao_detail');
    if (path === "/perfil") return t('header.titles.profile');
    if (path === "/menu") return t('header.titles.menu');
    return null;
  };

  const title = getTitle();

  return (
    <header className={cn("fixed top-0 inset-x-0 z-30 backdrop-blur-xl border-b border-white/[0.06] safe-top shadow-[0_4px_30px_rgba(0,0,0,0.4)] md:absolute md:w-full", className)} style={{ background: 'rgba(8, 32, 22, 0.55)' }}>
      <div className="flex items-center justify-between px-4 h-14 md:h-16 max-w-7xl mx-auto w-full">
        {isSubpage ? (
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary md:hidden">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-12 h-12 flex items-center justify-center p-1">
              <img src={logoUrl} alt="ArenaCopa" className="h-10 w-10 object-contain" />
            </div>
            <span className="font-black text-xl tracking-tight drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
              ARENA<span className="text-primary">COPA</span>
            </span>
          </div>
        )}

        {/* Desktop Title/Breadcrumb Substitute */}
        <div className="hidden md:flex items-center gap-3">
          {isSubpage && (
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {title && <h1 className="text-lg font-bold">{title}</h1>}
        </div>

        {title && isSubpage ? (
          <h1 className="text-base font-bold absolute left-1/2 -translate-x-1/2 md:hidden">{title}</h1>
        ) : null}

        <div className="flex items-center gap-3">
          <NotificationsSheet>
            <button className="w-10 h-10 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center relative transition-transform active:scale-95 hover:bg-secondary/80">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-copa-live rounded-full ring-2 ring-background" />
            </button>
          </NotificationsSheet>

          <NavLink to="/menu" className="md:hidden">
            <Avatar className="h-9 w-9 border border-primary/20 transition-transform active:scale-95">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {profile?.name?.substring(0, 2).toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>
          </NavLink>

          {/* Desktop Profile Menu */}
          <NavLink to="/perfil" className="hidden md:block">
            <div className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-full pr-3 transition-colors">
              <Avatar className="h-9 w-9 border border-primary/20">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {profile?.name?.substring(0, 2).toUpperCase() || "US"}
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

  const tabs = [
    { path: "/", icon: Home, label: t('nav.home') },
    { path: "/copa", icon: Trophy, label: t('nav.copa') },
    { path: "/boloes", icon: Dices, label: t('nav.bolao'), isFab: true },
    { path: "/guia", icon: Compass, label: t('nav.guia') },
    { path: "/ranking", icon: BarChart2, label: t('nav.ranking') },
  ];

  return (
    <nav className={cn("fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl border-t border-white/[0.06] safe-bottom shadow-[0_-4px_30px_rgba(0,0,0,0.4)]", className)} style={{ background: 'rgba(8, 32, 22, 0.55)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-primary to-[hsl(var(--copa-gold))] shadow-lg shadow-primary/40 -mt-7 border-4 border-background transition-transform active:scale-95",
                    isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )
                }
              >
                <span className="text-2xl">⚽</span>
              </NavLink>
            );
          }
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "/" || tab.path === "/copa"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors min-w-[56px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {tab.icon && <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />}
                  <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{tab.label}</span>
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
  const location = useLocation();
  const { t } = useTranslation('common');

  const tabs = [
    { path: "/", icon: Home, label: t('nav.home') },
    { path: "/copa", icon: Trophy, label: t('nav.copa') },
    { path: "/boloes", icon: Dices, label: t('nav.bolao'), isFab: true },
    { path: "/guia", icon: Compass, label: t('nav.guia') },
    { path: "/ranking", icon: BarChart2, label: t('nav.ranking') },
  ];

  return (
    <Sidebar className={cn("border-r border-white/10", className)} collapsible="icon">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <div className="p-4 flex items-center justify-center group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="ArenaCopa" className="h-8 w-8 object-contain" />
              </div>
              <span className="font-black text-xl tracking-tight drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                ARENA<span className="text-primary">COPA</span>
              </span>
            </div>
            <div className="hidden group-data-[collapsible=icon]:flex w-full items-center justify-center">
              <img src="/logo.png" alt="ArenaCopa" className="h-8 w-8 object-contain" />
            </div>
          </div>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {tabs.map((tab) => (
                <SidebarMenuItem key={tab.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === tab.path || (tab.path !== "/" && location.pathname.startsWith(tab.path))} tooltip={tab.label} className="h-12 hover:bg-white/5 active:bg-white/10 transition-colors">
                    <NavLink to={tab.path}>
                      {tab.icon ? <tab.icon /> : <Dices className="text-primary" />}
                      <span className="font-medium">{tab.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideBottomNav = location.pathname === "/boloes/criar";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background bg-[url('/images/campo-bg.png')] bg-fixed bg-cover bg-center bg-no-repeat bg-blend-overlay">
        <AppSidebar className="hidden md:flex z-40" />
        <SidebarInset className="bg-transparent flex flex-col flex-1 w-full overflow-hidden">
          <Header className="w-full" />
          <main className="flex-1 overflow-x-hidden pt-14 md:pt-20 px-4 pb-24 md:pb-8 w-full max-w-7xl mx-auto scrollbar-hide">
            {children}
          </main>
          {!hideBottomNav && <BottomTabs className="md:hidden" />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
