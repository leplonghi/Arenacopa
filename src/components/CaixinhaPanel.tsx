import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DollarSign, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BolaoData {
  id: string;
  name: string;
  prize_type?: string;
  prize_description?: string;
  pix_key?: string;
  caixinha_enabled?: boolean;
  caixinha_value_per_person?: number | null;
}

interface Props {
  bolao: BolaoData;
  isCreator: boolean;
}

const PRIZE_TYPE_DEFS = [
  { id: "money",  emoji: "💰" },
  { id: "beer",   emoji: "🍺" },
  { id: "food",   emoji: "🍖" },
  { id: "task",   emoji: "📝" },
  { id: "glory",  emoji: "🏅" },
  { id: "custom", emoji: "✏️" },
];

export function CaixinhaPanel({ bolao, isCreator }: Props) {
  const { toast } = useToast();
  const { t } = useTranslation('bolao');
  const [prizeType, setPrizeType] = useState(bolao.prize_type ?? "glory");
  const [prizeDesc, setPrizeDesc] = useState(bolao.prize_description ?? "");
  const [pixKey, setPixKey] = useState(bolao.pix_key ?? "");
  const [caixinha, setCaixinha] = useState(bolao.caixinha_enabled ?? false);
  const [valuePerPerson, setValuePerPerson] = useState<string>(String(bolao.caixinha_value_per_person ?? ""));
  const [saving, setSaving] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);

  // ── PIX key validation ──────────────────────────────────────────────
  const validatePixKey = (key: string): string | null => {
    if (!key.trim()) return t('caixinha.pix_required');
    const raw = key.replace(/[\s./-]/g, "");
    if (/^\d{11}$/.test(raw) || /^\d{14}$/.test(raw)) return null;   // CPF / CNPJ
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key.trim())) return null; // e-mail
    if (/^(\+55)?[\s-]?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/.test(key.trim())) return null; // fone
    if (/^[0-9a-fA-F-]{32,36}$/.test(key.trim())) return null;       // UUID aleatório
    return t('caixinha.pix_invalid');
  };

  const handleSave = async () => {
    if (prizeType === "money" && pixKey) {
      const err = validatePixKey(pixKey);
      if (err) { setPixError(err); return; }
    }
    setPixError(null);
    setSaving(true);
    try {
      await updateDoc(doc(db, "boloes", bolao.id), {
        prize_type: prizeType,
        prize_description: prizeDesc || null,
        pix_key: pixKey || null,
        caixinha_enabled: caixinha,
        caixinha_value_per_person: caixinha && valuePerPerson ? Number(valuePerPerson) : null,
        updated_at: new Date().toISOString(),
      });
      toast({ title: t('caixinha.saved_ok'), className: "bg-emerald-500 text-white font-black" });
    } catch (e) {
      toast({ title: t('caixinha.save_error'), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    const val = valuePerPerson ? `${t('caixinha.currency_symbol')}${valuePerPerson}` : t('caixinha.value_combined');
    const pix = pixKey ? t('caixinha.pix_text', { key: pixKey }) : "";
    const prize = prizeDesc || (PRIZE_TYPE_DEFS.find(p => p.id === prizeType) ? t(`caixinha.prize_types.${prizeType}`) : prizeType);
    
    const msg = t('caixinha.whatsapp_msg', {
      name: bolao.name,
      value: val,
      pix: pix,
      prize: prize
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Read-only view for participants
  if (!isCreator) {
    const type = PRIZE_TYPE_DEFS.find(p => p.id === prizeType);
    return (
      <div className="space-y-3">
        {prizeType && prizeType !== "glory" && (
          <div className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
            <span className="text-2xl">{type?.emoji}</span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">{t('caixinha.prize_label')}</p>
              <p className="text-sm font-bold">{prizeDesc || (type ? t(`caixinha.prize_types.${type.id}`) : '')}</p>
            </div>
          </div>
        )}
        {caixinha && valuePerPerson && (
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <p className="text-sm font-bold">{t('caixinha.fund_label')} {t('caixinha.currency_symbol')}{valuePerPerson} {t('caixinha.fund_per_person')}</p>
          </div>
        )}
      </div>
    );
  }

  // Admin editor
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-zinc-400">{t('caixinha.prize_type_label')}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRIZE_TYPE_DEFS.map((p) => (
            <button key={p.id} onClick={() => setPrizeType(p.id)}
              className={cn("rounded-2xl border p-3 text-center transition-all",
                prizeType === p.id ? "border-primary bg-primary/10" : "surface-card-soft")}>
              <div className="text-2xl">{p.emoji}</div>
              <p className="mt-1 text-xs font-bold">{t(`caixinha.prize_types.${p.id}`)}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">{t('caixinha.prize_desc_label')}</p>
        <input value={prizeDesc} onChange={(e) => setPrizeDesc(e.target.value)}
          placeholder={t('caixinha.prize_desc_placeholder')}
          className="surface-input w-full rounded-2xl px-4 py-3 text-sm" />
      </div>

      {prizeType === "money" && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">{t('caixinha.pix_label')}</p>
          <input value={pixKey} onChange={(e) => { setPixKey(e.target.value); setPixError(null); }}
            placeholder={t('caixinha.pix_placeholder')}
            className="surface-input w-full rounded-2xl px-4 py-3 text-sm" />
          {pixError && <p className="mt-1.5 px-1 text-xs text-red-400">{pixError}</p>}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-black">{t('caixinha.enable_fund')}</p>
          <p className="text-xs text-zinc-400">{t('caixinha.fund_control')}</p>
        </div>
        <button onClick={() => setCaixinha(!caixinha)}
          className={cn("h-7 w-14 rounded-full transition-all", caixinha ? "bg-primary" : "bg-white/20")}>
          <span className={cn("block h-5 w-5 rounded-full bg-white shadow transition-all mx-1", caixinha ? "translate-x-7" : "translate-x-0")} />
        </button>
      </div>

      {caixinha && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">{t('caixinha.value_per_person')}</p>
          <input type="number" value={valuePerPerson} onChange={(e) => setValuePerPerson(e.target.value)}
            placeholder={t('caixinha.value_placeholder')} className="surface-input w-full rounded-2xl px-4 py-3 text-sm" />
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 rounded-2xl bg-primary py-3 text-[11px] font-black uppercase tracking-widest text-black disabled:opacity-60">
          {saving ? t('caixinha.saving') : t('caixinha.save')}
        </button>
        {(caixinha || prizeType === "money") && (
          <button onClick={handleWhatsApp}
            className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20 transition-colors">
            <MessageSquare className="h-4 w-4 text-primary" /> {t('caixinha.whatsapp')}
          </button>
        )}
      </div>
    </div>
  );
}
