import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "react-router-dom";
import { User, Bell, ShieldQuestion, ShieldAlert, Trophy, Settings, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import React from "react";

export function MobileMenuSheet({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] bg-[#03100a] border-t border-white/10 p-0 flex flex-col rounded-t-[24px]">
        <SheetHeader className="p-6 pb-2 text-left shrink-0">
          <SheetTitle className="text-xl font-bold">{t('nav.menu', 'Menu')}</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6">
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('menu.account', 'Minha Conta')}</h3>
            <MenuLink to="/perfil" icon={<User className="w-5 h-5" />} label={t('nav.profile', 'Perfil')} onClick={() => setOpen(false)} />
            <MenuLink to="/noticias" icon={<Bell className="w-5 h-5" />} label={t('nav.news', 'Avisos & Notícias')} onClick={() => setOpen(false)} />
            <MenuLink to="/ranking" icon={<Trophy className="w-5 h-5" />} label="Ranking Geral" onClick={() => setOpen(false)} />
            <MenuLink to="/premium" icon={<Star className="w-5 h-5 text-yellow-500" />} label="Arena Premium" onClick={() => setOpen(false)} />
          </div>

          <div className="grid gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('menu.support', 'Suporte')}</h3>
            <MenuLink to="/regras" icon={<ShieldQuestion className="w-5 h-5" />} label={t('regras.title', 'Regras do Jogo')} onClick={() => setOpen(false)} />
            <MenuLink to="/termos" icon={<ShieldAlert className="w-5 h-5" />} label={t('footer.terms', 'Termos de Uso')} onClick={() => setOpen(false)} />
            <MenuLink to="/privacidade" icon={<ShieldAlert className="w-5 h-5" />} label={t('footer.privacy', 'Privacidade')} onClick={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MenuLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={({ isActive }) => cn(
        "flex items-center gap-4 p-3 rounded-xl transition-colors",
        isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-white/5 text-foreground"
      )}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 shrink-0">
        {icon}
      </div>
      <span className="text-base">{label}</span>
    </NavLink>
  );
}
