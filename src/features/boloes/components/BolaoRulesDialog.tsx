import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import type { BolaoData, BolaoMarket } from "@/types/bolao";

interface BolaoRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bolao: BolaoData;
  formatLabel: string | null;
  bolaoMarkets: BolaoMarket[];
}

export function BolaoRulesDialog({
  open,
  onOpenChange,
  bolao,
  formatLabel,
  bolaoMarkets,
}: BolaoRulesDialogProps) {
  const { t } = useTranslation('bolao');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-dialog sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('bolao_detail.rules_modal_title')}</DialogTitle>
        </DialogHeader>

        <div className="surface-card-soft space-y-3 rounded-2xl p-4 text-sm">
          {formatLabel && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_format')}</span><strong>{formatLabel}</strong></div>}
          {bolaoMarkets.length > 0 && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_active_markets')}</span><strong>{bolaoMarkets.length}</strong></div>}
          {bolao.visibility_mode && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_visibility')}</span><strong>{bolao.visibility_mode}</strong></div>}
          {bolao.cutoff_mode && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_cutoff')}</span><strong>{bolao.cutoff_mode}</strong></div>}
          <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_exact_score')}</span><strong>{bolao.scoring_rules?.exact ?? 0} {t('bolao_detail.points')}</strong></div>
          <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_winner_result')}</span><strong>{bolao.scoring_rules?.winner ?? 0} {t('bolao_detail.points')}</strong></div>
          <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_draw')}</span><strong>{bolao.scoring_rules?.draw ?? 0} {t('bolao_detail.points')}</strong></div>
          <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_participation')}</span><strong>{bolao.scoring_rules?.participation ?? 0} {t('bolao_detail.points')}</strong></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
