import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type PoolContextMode = "standalone" | "existing_group" | "new_group";

type PoolContextChooserProps = {
  value: PoolContextMode;
  onChange: (value: PoolContextMode) => void;
  hasGroups: boolean;
};

export function PoolContextChooser({
  value,
  onChange,
  hasGroups,
}: PoolContextChooserProps) {
  const { t } = useTranslation("bolao");

  const options: Array<{
    id: PoolContextMode;
    title: string;
    description: string;
  }> = [
    {
      id: "standalone",
      title: t("creation.context.modes.standalone"),
      description: t("creation.context.modes_desc.standalone"),
    },
    {
      id: "existing_group",
      title: t("creation.context.modes.existing_group"),
      description: t("creation.context.modes_desc.existing_group"),
    },
    {
      id: "new_group",
      title: t("creation.context.modes.new_group"),
      description: t("creation.context.modes_desc.new_group"),
    },
  ];

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
