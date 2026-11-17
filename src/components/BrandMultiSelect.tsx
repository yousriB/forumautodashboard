import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandInfo } from "@/lib/brands";

interface BrandMultiSelectProps {
  options: BrandInfo[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
  /** Show "Tout sélectionner / Tout effacer" shortcuts. */
  showBulkActions?: boolean;
}

/** Toggle-chip multi-select used for brand assignment and report filters. */
export function BrandMultiSelect({
  options,
  value,
  onChange,
  disabled,
  className,
  showBulkActions = true,
}: BrandMultiSelectProps) {
  const selected = new Set(value);
  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(options.map((o) => o.code).filter((c) => next.has(c)));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showBulkActions && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {value.length === 0
              ? "Aucune marque sélectionnée"
              : `${value.length} marque${value.length > 1 ? "s" : ""} sélectionnée${value.length > 1 ? "s" : ""}`}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              className="font-medium text-foreground hover:underline disabled:opacity-50"
              onClick={() => onChange(options.map((o) => o.code))}
              disabled={disabled}
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              className="font-medium text-foreground hover:underline disabled:opacity-50"
              onClick={() => onChange([])}
              disabled={disabled || value.length === 0}
            >
              Tout effacer
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Marques">
        {options.map((brand) => {
          const on = selected.has(brand.code);
          return (
            <button
              key={brand.code}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={disabled}
              onClick={() => toggle(brand.code)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                on
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              )}
            >
              {on && <Check className="h-3 w-3" />}
              {brand.label}
              {!brand.active && <span className="opacity-70">(historique)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
