import { cn } from "@/lib/utils";

export type PoolContextMode = "standalone" | "existing_group" | "new_group";

type PoolContextChooserProps = {
  value: PoolContextMode;
  onChange: (value: PoolContextMode) => void;
  hasGroups: boolean;
};

const options: Array<{
  id: PoolContextMode;
  title: string;
  description: string;
}> = [
  {
    id: "standalone",
    title: "Sem grupo",
    description: "O bolão vive sozinho e você controla os convites por ele mesmo.",
  },
  {
    id: "existing_group",
    title: "Em um grupo existente",
    description: "O bolão nasce já conectado a uma comunidade que você participa.",
  },
  {
    id: "new_group",
    title: "Criar grupo + bolão",
    description: "Você monta a comunidade e o bolão no mesmo fluxo, sem ida e volta.",
  },
];

export function PoolContextChooser({
  value,
  onChange,
  hasGroups,
}: PoolContextChooserProps) {
  return (
    <div className="grid gap-3">
      {options
        .filter((option) => option.id !== "existing_group" || hasGroups)
        .map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-3xl border p-4 text-left transition-colors",
              value === option.id
                ? "border-primary bg-primary/10"
                : "border-white/10 bg-white/5",
            )}
          >
            <p className="text-sm font-black text-white">{option.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{option.description}</p>
          </button>
        ))}
    </div>
  );
}
