import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-20 md:pb-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground text-center sm:text-left flex-1 max-w-3xl">
                    Usamos apenas cookies essenciais para autenticação.
                    <Link to="/privacidade" className="text-primary hover:underline ml-1">
                        Saiba mais na nossa Política de Privacidade.
                    </Link>
                </p>
                <Button onClick={handleAccept} className="w-full sm:w-auto font-bold bg-primary text-primary-foreground">
                    Entendi
                </Button>
            </div>
        </div>
    );
}
