import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Crown, DollarSign, CheckCircle2, Shield, Clock, AlertCircle, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type MemberData } from "@/types/bolao";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "../animations";
import { removeBolaoMember, updateBolaoMemberPaymentStatus } from "@/services/boloes/bolao.service";

interface MembrosTabProps {
    members: MemberData[];
    userId: string;
    isCreator: boolean;
    bolaoId: string;
    isPaid?: boolean;
    onRefresh: () => void;
}

export function MembrosTab({ members, userId, isCreator, bolaoId, isPaid, onRefresh }: MembrosTabProps) {
    const { t } = useTranslation('bolao');
    const { toast } = useToast();
    const navigate = useNavigate();

    const STATUS_CONFIG = {
        pending: {
            label: t('members.status.pending'),
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
            icon: Clock
        },
        paid: {
            label: t('members.status.paid'),
            color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
            icon: CheckCircle2
        },
        exempt: {
            label: t('members.status.exempt'),
            color: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
            icon: Shield
        },
    };

    const handleLeave = async () => {
        if (!confirm(t('members.leave_confirm'))) return;
        try {
            await removeBolaoMember(bolaoId, userId);
            toast({
                title: t('members.left_success'),
                className: "bg-emerald-500 border-emerald-600 text-white font-black uppercase text-[10px] tracking-widest"
            });
            navigate("/boloes");
        } catch (error) {
            toast({ title: t('common.error_title'), description: error instanceof Error ? error.message : t('common.error_title'), variant: "destructive" });
        }
    };

    const handleRemove = async (targetUserId: string) => {
        if (!confirm(t('members.remove_confirm'))) return;
        try {
            await removeBolaoMember(bolaoId, targetUserId);
            toast({
                title: t('members.removed_success'),
                className: "bg-emerald-500 border-emerald-600 text-white font-black uppercase text-[10px] tracking-widest"
            });
            onRefresh();
        } catch (error) {
            toast({ title: t('common.error_title'), description: error instanceof Error ? error.message : t('common.error_title'), variant: "destructive" });
        }
    };

    const cyclePaymentStatus = async (targetUserId: string, currentStatus: string) => {
        if (!isCreator) return;

        const nextStatus = currentStatus === 'pending' ? 'paid' : currentStatus === 'paid' ? 'exempt' : 'pending';

        try {
            await updateBolaoMemberPaymentStatus({
                bolaoId,
                userId: targetUserId,
                paymentStatus: nextStatus,
            });
            onRefresh();
        } catch (error) {
            toast({ title: t('common.error_title'), description: t('members.error_update'), variant: "destructive" });
        }
    };

    const paidCount = members.filter(m => m.payment_status === 'paid' || m.payment_status === 'exempt').length;
    const totalCount = members.length;
    const paymentProgress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Payment Summary for Admin - Enhanced Glassmorphism */}
            {isPaid && (
                <motion.div variants={staggerItem} className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-5 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-32 h-32 text-emerald-500" />
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('members.financial_status')}</span>
                                    <span className="text-sm font-black text-white">{t('members.status.paid')} {paidCount}/{totalCount}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-white">{paymentProgress}%</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 block">TOTAL PAID</span>
                            </div>
                        </div>

                        <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${paymentProgress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                            </motion.div>
                        </div>

                        {isCreator && (
                            <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-[10px] text-blue-400/80 font-medium leading-tight">
                                    {t('members.status_hint')}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        {t('members.participants_count', { count: members.length })}
                    </h3>
                </div>

                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {members.map((m) => {
                            const name = m.profile?.name || t('members.default_user');
                            const isMe = m.user_id === userId;
                            const status = m.payment_status || 'pending';
                            const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                            const StatusIcon = statusConfig?.icon || Clock;

                            return (
                                <motion.div
                                    key={m.user_id}
                                    variants={staggerItem}
                                    layout
                                    className={cn(
                                        "glass-card p-4 transition-all border group",
                                        isMe ? "border-primary/20 bg-primary/[0.03]" : "border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar with Premium Border */}
                                        <div className="relative shrink-0">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center p-0.5 transition-transform group-hover:scale-105",
                                                m.role === 'admin' ? "bg-gradient-to-br from-primary to-primary/50" : "bg-white/10"
                                            )}>
                                                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center text-xs font-black overflow-hidden border border-white/10">
                                                    {m.profile?.avatar_url ? (
                                                        <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-gray-500">{name.slice(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {m.role === 'admin' && (
                                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-[#121212]">
                                                    <Crown className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={cn(
                                                    "text-sm font-black truncate tracking-tight",
                                                    isMe ? "text-primary" : "text-white"
                                                )}>
                                                    {name}{isMe && ` (${t('members.you')})`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                    {m.role === "admin" ? t('members.role.admin') : t('members.role.member')}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-gray-700" />
                                                <span className="text-[10px] font-bold text-gray-600">
                                                    #{m.user_id.slice(0, 4)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions & Status */}
                                        <div className="flex items-center gap-3">
                                            {isPaid && (
                                                <motion.button
                                                    whileTap={isCreator ? { scale: 0.95 } : {}}
                                                    onClick={() => cyclePaymentStatus(m.user_id, status)}
                                                    disabled={!isCreator}
                                                    className={cn(
                                                        "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all",
                                                        statusConfig?.color || "bg-white/5 border-white/10 text-gray-400",
                                                        !isCreator && "cursor-default opacity-80"
                                                    )}
                                                >
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    <span className="hidden xs:inline">{statusConfig?.label}</span>
                                                </motion.button>
                                            )}

                                            {isCreator && !isMe && (
                                                <button
                                                    onClick={() => handleRemove(m.user_id)}
                                                    className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center border border-transparent hover:border-red-500/20"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {!isCreator && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLeave}
                        className="w-full py-4 rounded-2xl border-2 border-red-500/10 text-red-500 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all"
                    >
                        <LogOut className="w-4 h-4" /> {t('members.leave_bolao')}
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
