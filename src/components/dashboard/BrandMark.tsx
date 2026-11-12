import { cn } from "@/lib/utils";

/** Forum Auto mark: ink tile with a lime monogram. */
export function BrandMark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-12 w-12 rounded-2xl text-lg" : size === "sm" ? "h-7 w-7 rounded-lg text-[11px]" : "h-9 w-9 rounded-xl text-sm";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary font-semibold tracking-tight text-lime",
        box,
        className,
      )}
      aria-hidden="true"
    >
      fa
    </div>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-tight text-foreground">forum auto</div>
        <div className="eyebrow mt-1 text-[10px]">sales desk</div>
      </div>
    </div>
  );
}
