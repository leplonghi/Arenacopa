import { Settings, LogOut, User, BookOpen, HelpCircle, Bell, Shield, Store, Users2, PlusCircle, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Menu() {
    const { t } = useTranslation("profile");
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate("/auth");
    };

    return (
        <div className="p-4 space-y-4">
            <div>
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">{t("menu.kicker")}</span>
                <h1 className="text-2xl font-black">{t("menu.title")}</h1>
            </div>

            <div className="space-y-2">
                <button
                    onClick={() => navigate("/perfil")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <User className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">{t("menu.profile_title")}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("menu.profile_desc")}</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/regras")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-sm">{t("menu.rules_title")}</span>
                </button>

                <button
                    onClick={() => navigate("/comunidades")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Users2 className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Comunidades</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Acesse seus grupos e espaços de disputa.</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/comunidades/criar")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <PlusCircle className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Criar comunidade</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Monte um espaço para reunir participantes.</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/negocios")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Store className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">ArenaCup para Negócios</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Crie campanha com QR, link e benefício simples.</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/negocios/criar")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Megaphone className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Criar campanha</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Publique uma campanha para dias de jogo.</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/perfil")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Bell className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">{t("menu.notifications_title")}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("menu.notifications_desc")}</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/perfil")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Settings className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">{t("menu.settings_title")}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("menu.settings_desc")}</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/privacidade")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">{t("menu.privacy_title")}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("menu.privacy_desc")}</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/regras")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">{t("menu.help_title")}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("menu.help_desc")}</p>
                    </div>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3 text-red-500"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold text-sm">{t("menu.logout")}</span>
                </button>
            </div>
        </div>
    );
}
