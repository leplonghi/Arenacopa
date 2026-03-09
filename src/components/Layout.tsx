import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { Home, Trophy, BookOpen, BarChart2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/escudo_arenacopa_logo.png";

const tabs = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/copa", icon: Trophy, label: "Copa" },
  { path: "__fab__", icon: null, label: "" },
  { path: "/guia", icon: BookOpen, label: "Guia" },
  { path: "/ranking", icon: BarChart2, label: "Ranking" },
];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initials, setInitials] = useState("?");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isSubpage = location.pathname.split("/").filter(Boolean).length > 1;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.name) setInitials(data.name.slice(0, 2).toUpperCase());
        else if (user.email) setInitials(user.email.slice(0, 2).toUpperCase());
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/") return null;
    if (path.startsWith("/copa")) return null;
    if (path === "/boloes") return "Bolões";
    if (path === "/boloes/criar") return "Criar Bolão";
    if (path.startsWith("/boloes/")) return "Bolão";
    if (path === "/guia") return null;
    if (path === "/ranking") return "Ranking";
    if (path === "/perfil") return "Perfil";
    return null;
  };

  const title = getTitle();

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/[0.06] safe-top shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
      style={{ background: "rgba(5, 20, 16, 0.6)" }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {isSubpage ? (
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 p-1 shadow-lg shadow-primary/20">
              <img src={logo} alt="ArenaCopa" className="h-10 w-10 object-contain" />
            </div>
            <span className="font-black text-xl tracking-tight drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
              ARENA<span className="text-primary">COPA</span>
            </span>
          </div>
        )}

        {title && isSubpage ? (
          <h1 className="text-base font-bold absolute left-1/2 -translate-x-1/2">{title}</h1>
        ) : null}

        {/* Profile avatar — replaces bell as Perfil entry point */}
        <Link
          to="/perfil"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-copa-green/60 to-copa-green/30 border border-copa-green/30 flex items-center justify-center overflow-hidden text-xs font-black shrink-0"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}

function BottomTabs() {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl border-t border-white/[0.06] safe-bottom shadow-[0_-4px_30px_rgba(0,0,0,0.4)]"
      style={{ background: "rgba(5, 20, 16, 0.6)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        {tabs.map((tab) => {
          if (tab.path === "__fab__") {
            return (
              <button
                key="fab"
                onClick={() => navigate("/boloes/criar")}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-primary to-[hsl(var(--copa-gold))] shadow-lg shadow-primary/40 -mt-7 border-4 border-background"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 2 L14.5 8 L12 6.5 L9.5 8 Z" fill="currentColor" opacity="0.4" />
                  <path d="M12 22 L14.5 16 L12 17.5 L9.5 16 Z" fill="currentColor" opacity="0.4" />
                  <path d="M2 12 L8 9.5 L6.5 12 L8 14.5 Z" fill="currentColor" opacity="0.4" />
                  <path d="M22 12 L16 9.5 L17.5 12 L16 14.5 Z" fill="currentColor" opacity="0.4" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6" />
                </svg>
              </button>
            );
          }
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "/"}
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

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
