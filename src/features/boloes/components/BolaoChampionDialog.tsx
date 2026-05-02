import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flag } from "@/components/Flag";
import { teams } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface BolaoChampionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championSelection: string;
  onSelect: (code: string) => void;
  onConfirm: () => void;
}

export function BolaoChampionDialog({
  open,
  onOpenChange,
  championSelection,
  onSelect,
  onConfirm,
}: BolaoChampionDialogProps) {
  const { t } = useTranslation('bolao');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-dialog sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('bolao_detail.who_is_champion_title')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 py-4">
          {teams.map((team) => (
            <button
              key={team.code}
              onClick={() => onSelect(team.code)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-2 transition-all",
                championSelection === team.code ? "bg-primary/20 ring-1 ring-primary" : "bg-white/5 hover:bg-white/10"
              )}
            >
              <Flag code={team.code} className="h-8 w-12" />
              <span className="text-[10px] font-bold uppercase">{team.code}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onConfirm}
          disabled={!championSelection}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-black disabled:opacity-50"
        >
          {t('bolao_detail.confirm_bet_btn')}
        </button>
      </DialogContent>
    </Dialog>
  );
}
