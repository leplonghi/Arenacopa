import React, { useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Trophy, UserPlus, Info, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    type: "info" | "success" | "warning" | "invite";
    read: boolean;
    link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        title: "Bem-vindo ao ArenaCopa!",
        message: "Prepare seus palpites e divirta-se com seus amigos.",
        created_at: new Date().toISOString(),
        type: "info",
        read: false,
    },
];

export function NotificationsSheet({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isDemo = localStorage.getItem("demo_mode") === "true";
    const { t, i18n } = useTranslation('common');

    const localeMap: Record<string, any> = {
        'pt-BR': ptBR,
        'en': enUS,
        'es': es
    };

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: async () => {
            if (isDemo) return MOCK_NOTIFICATIONS;
            if (!user) return [];

            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching notifications:", error);
                return [];
            }

            return data as Notification[];
        },
        enabled: !!user || isDemo,
    });

    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            if (isDemo) return;
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            if (isDemo) return;
            if (!user) return;

            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(t('notifications.mark_all_read'));
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return <Trophy className="w-5 h-5 text-yellow-500" />;
            case "invite":
                return <UserPlus className="w-5 h-5 text-blue-500" />;
            case "info":
            default:
                return <Info className="w-5 h-5 text-primary" />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead.mutate(notification.id);
        }
        // If there's a link, we could navigate here using useNavigate
    };

    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="w-[90%] sm:w-[400px] bg-background/95 backdrop-blur-xl border-l border-white/10">
                <SheetHeader className="text-left mb-6">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                            <Bell className="w-5 h-5 text-primary" />
                            {t('notifications.title')}
                            {unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                    {t('notifications.new_count', { count: unreadCount })}
                                </span>
                            )}
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead.mutate()}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                {t('notifications.mark_all_read')}
                            </button>
                        )}
                    </div>
                    <SheetDescription>
                        {t('notifications.description')}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                    <div className="flex flex-col gap-3">
                        {isLoading ? (
                            <div className="text-center py-10 text-muted-foreground">{t('common.loading')}</div>
                        ) : (
                            <>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 rounded-xl border transition-colors cursor-pointer ${notification.read
                                            ? "bg-secondary/30 border-transparent"
                                            : "bg-secondary/60 border-primary/20 hover:bg-secondary/80"
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 bg-background p-2 rounded-full h-fit shadow-sm">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-sm text-foreground">
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                        {formatDistanceToNow(new Date(notification.created_at), {
                                                            addSuffix: true,
                                                            locale: localeMap[i18n.language] || ptBR,
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-snug">
                                                    {notification.message}
                                                </p>
                                                {!notification.read && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        {t('notifications.new')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {!isLoading && notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-60">
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                <Bell className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">{t('notifications.empty')}</p>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
