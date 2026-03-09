import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  /** Optional spotlight color for dramatic effect, e.g. "copa-gold" */
  glowColor?: "gold" | "green" | "live" | "none";
}

const glowMap = {
  gold: "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--copa-gold) / 0.12) 0%, transparent 70%)",
  green: "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--copa-green) / 0.12) 0%, transparent 70%)",
  live: "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--copa-live) / 0.12) 0%, transparent 70%)",
  none: "none",
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function EmptyState({ icon, title, description, action, className, glowColor = "none" }: EmptyStateProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col items-center justify-center py-12 px-6 text-center relative", className)}
      style={{ background: glowMap[glowColor] }}
    >
      {/* Floating icon with subtle bounce */}
      <motion.span
        variants={itemVariants}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-5xl mb-4 select-none"
        aria-hidden
      >
        {icon}
      </motion.span>

      <motion.h3 variants={itemVariants} className="text-lg font-black mb-1">
        {title}
      </motion.h3>

      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-5 max-w-xs leading-relaxed">
        {description}
      </motion.p>

      {action && (
        <motion.div variants={itemVariants}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon="⚠️"
      title={t("common.error_title")}
      description={t("common.error_desc")}
      glowColor="live"
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {t("common.retry", { defaultValue: "Tentar novamente" })}
          </button>
        )
      }
      className={className}
    />
  );
}
