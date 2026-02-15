import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, X, Crown, DollarSign, CheckCircle2, Shield, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type MemberData } from "@/types/bolao";

interface MembrosTabProps {
    members: MemberData[];
    userId: string;
    isCreator: boolean;
    bolaoId: string;
    isPaid?: boolean;
    onRefresh: () => void;
}

// STATUS_CONFIG moved inside component for translation

export function MembrosTab({ members, userId, isCreator, bolaoId, isPaid, onRefresh }: MembrosTabProps) {
    const { t } = useTranslation('bolao');
    const { toast } = useToast();
    const navigate = useNavigate();

    const STATUS_CONFIG = {
        pending: { label: t('members.status.pending'), color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20", icon: Clock },
        paid: { label: t('members.status.paid'), color: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20", icon: CheckCircle2 },
        exempt: { label: t('members.status.exempt'), color: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20", icon: Shield },
    };

    const handleLeave = async () => {
        if (!confirm(t('members.leave_confirm'))) return;
        const { error } = await supabase.from("bolao_members").delete().eq("bolao_id", bolaoId).eq("user_id", userId);
        if (error) {
            toast({ title: t('common.error_title'), description: error.message, variant: "destructive" });
        } else {
            toast({ title: t('members.left_success') });
            navigate("/boloes");
        }
    };

    const handleRemove = async (targetUserId: string) => {
        if (!confirm(t('members.remove_confirm'))) return;
        const { error } = await supabase.from("bolao_members").delete().eq("bolao_id", bolaoId).eq("user_id", targetUserId);
        if (error) {
            toast({ title: t('common.error_title'), description: error.message, variant: "destructive" });
        } else {
            toast({ title: t('members.removed_success') });
            onRefresh();
        }
    };

    const cyclePaymentStatus = async (targetUserId: string, currentStatus: string) => {
        if (!isCreator) return;

        const nextStatus = currentStatus === 'pending' ? 'paid' : currentStatus === 'paid' ? 'exempt' : 'pending';

        const { error } = await supabase
            .from("bolao_members")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update({ payment_status: nextStatus } as any)
            .eq("bolao_id", bolaoId)
            .eq("user_id", targetUserId);

        if (error) {
            toast({ title: t('common.error_title'), description: t('members.error_update'), variant: "destructive" });
        } else {
            onRefresh();
        }
    };

    const paidCount = members.filter(m => m.payment_status === 'paid' || m.payment_status === 'exempt').length;
    const totalCount = members.length;
    const paymentProgress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Payment Summary for Admin */}
            {isPaid && (
                <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <span className="font-bold text-sm">{t('members.financial_status')}</span>
                        </div>
                        <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-md">{paymentProgress}% {t('members.status.paid')}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${paymentProgress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{paidCount} {t('members.paid_exempt')}</span>
                        <span>{totalCount - paidCount} {t('members.pendings')}</span>
                    </div>
                    {isCreator && (
                        <div className="flex items-center gap-2 text-[10px] text-blue-600 bg-blue-500/10 p-2 rounded-md">
                            <AlertCircle className="w-3 h-3" />
                            <span>{t('members.status_hint')}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{t('members.participants_count', { count: members.length })}</h3>
                <div className="glass-card divide-y divide-border/30">
                    {members.map((m) => {
                        const name = m.profile?.name || t('members.default_user');
                        const isMe = m.user_id === userId;
                        const status = m.payment_status || 'pending';
                        const StatusIcon = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.icon || Clock;
                        const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

                        return (
                            <div key={m.user_id} className={cn("flex items-center gap-3 p-3 transition-colors", isMe ? "bg-primary/5" : "hover:bg-secondary/20")}>
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-black overflow-hidden border-2 border-transparent group-hover:border-primary/20">
                                        {m.profile?.avatar_url ? (
                                            <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-muted-foreground">{name.slice(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    {m.role === 'admin' && (
                                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background shadow-sm" title="Admin">
                                            <Crown className="w-2.5 h-2.5" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("text-sm font-bold truncate", isMe && "text-primary")}>
                                            {name}{isMe && ` ${t('members.you')}`}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                                        {m.role === "admin" ? t('members.role.admin') : t('members.role.member')}
                                    </span>
                                </div>

                                {/* Payment Status (Only for Paid Pools) */}
                                {isPaid && (
                                    <button
                                        onClick={() => cyclePaymentStatus(m.user_id, status)}
                                        disabled={!isCreator}
                                        title={isCreator ? t('members.click_to_change_status') : t('members.payment_status')}
                                        className={cn(
                                            "px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all shadow-sm",
                                            statusConfig.color,
                                            isCreator ? "active:scale-95 cursor-pointer hover:shadow-md" : "cursor-default opacity-80"
                                        )}
                                    >
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{statusConfig.label}</span>
                                    </button>
                                )}

                                {/* Remove Action */}
                                {isCreator && !isMe && (
                                    <button
                                        onClick={() => handleRemove(m.user_id)}
                                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        title={t('members.remove_member')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {!isCreator && (
                <button
                    onClick={handleLeave}
                    className="w-full py-3 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                    <LogOut className="w-4 h-4" /> {t('members.leave_bolao')}
                </button>
            )}
        </div>
    );
}
