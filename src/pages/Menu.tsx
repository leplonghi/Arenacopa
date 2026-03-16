import { Settings, LogOut, User, BookOpen, HelpCircle, Bell, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Menu() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate("/auth");
    };

    return (
        <div className="p-4 space-y-4">
            <div>
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">Configurações</span>
                <h1 className="text-2xl font-black">Menu</h1>
            </div>

            <div className="space-y-2">
                <button
                    onClick={() => navigate("/perfil")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <User className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Meu Perfil</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Time favorito, preferências</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/regras")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-sm">Regras & Regulamento</span>
                </button>

                <button
                    onClick={() => navigate("/perfil")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Bell className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Notificações</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Alertas, push e preferências</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/perfil")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Settings className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Configurações</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Conta, idioma e preferências</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/privacidade")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Privacidade & Termos</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Políticas e uso da plataforma</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate("/regras")}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
                >
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                        <span className="font-bold text-sm">Ajuda & FAQ</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Regras, dúvidas e orientação rápida</p>
                    </div>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full p-4 glass-card-hover text-left flex items-center gap-3 text-red-500"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold text-sm">Sair</span>
                </button>
            </div>
        </div>
    );
}
