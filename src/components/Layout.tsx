import { NavLink, useLocation } from "react-router-dom";
import { Home, Trophy, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/arenacopa_logo.png";
import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/copa", icon: Trophy, label: "Copa" },
  { path: "/boloes", icon: Users, label: "Bolões" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSubpage = location.pathname.split("/").filter(Boolean).length > 1;

  // Get page title
  const getTitle = () => {
    const path = location.pathname;
    if (path === "/") return null; // show logo
    if (path === "/copa") return "Copa";
    if (path.startsWith("/copa/")) return "Copa";
    if (path === "/boloes") return "Bolões";
    if (path === "/boloes/criar") return "Criar Bolão";
    if (path.startsWith("/boloes/")) return "Bolão";
    if (path === "/perfil") return "Perfil";
    return null;
  };

  const title = getTitle();

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50 safe-top">
      <div className="flex items-center justify-between px-4 h-14">
        {isSubpage ? (
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8" />
        )}

        {title ? (
          <h1 className="text-base font-bold">{title}</h1>
        ) : (
          <img src={logo} alt="ArenaCopa" className="h-8" />
        )}

        <button className="p-1.5 -mr-1.5 rounded-lg hover:bg-secondary relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-copa-live rounded-full" />
        </button>
      </div>
    </header>
  );
}

function BottomTabs() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[60px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn("p-1.5 rounded-xl transition-colors", isActive && "bg-primary/15")}>
                  <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
