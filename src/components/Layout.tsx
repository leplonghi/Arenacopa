import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Trophy, Users, User, Bell, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/arenacopa_logo.png";

const tabs = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/copa", icon: Trophy, label: "Copa" },
  { path: "__fab__", icon: null, label: "" },
  { path: "/boloes", icon: Users, label: "Bolões" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSubpage = location.pathname.split("/").filter(Boolean).length > 1;

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/") return null;
    if (path.startsWith("/copa")) return null;
    if (path === "/boloes") return "Bolões";
    if (path === "/boloes/criar") return "Criar Bolão";
    if (path.startsWith("/boloes/")) return "Bolão";
    if (path === "/perfil") return "Perfil";
    return null;
  };

  const title = getTitle();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md border-b border-border/30 safe-top" style={{ background: 'rgba(5, 20, 16, 0.9)' }}>
      <div className="flex items-center justify-between px-4 h-14">
        {isSubpage ? (
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden">
              <img src={logo} alt="ArenaCopa" className="h-10 w-10 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            </div>
            <span className="font-black text-lg tracking-tight">
              ARENA<span className="text-primary">COPA</span>
            </span>
          </div>
        )}

        {title && isSubpage ? (
          <h1 className="text-base font-bold absolute left-1/2 -translate-x-1/2">{title}</h1>
        ) : null}

        <button className="w-10 h-10 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-copa-live rounded-full" />
        </button>
      </div>
    </header>
  );
}

function BottomTabs() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-md border-t border-border/30 safe-bottom" style={{ background: 'rgba(5, 20, 16, 0.92)' }}>
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
