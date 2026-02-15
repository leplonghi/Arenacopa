import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

import { useTranslation } from "react-i18next";

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  const { t } = useTranslation('common');
  return (
    <EmptyState
      icon="⚠️"
      title={t('common.error_title')}
      description={t('common.error_desc')}
      action={
        onRetry && (
          <button onClick={onRetry} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm">
            {t('common.retry', { defaultValue: 'Tentar novamente' })}
          </button>
        )
      }
      className={className}
    />
  );
}
