import { cn } from "@/lib/utils";

/** The real Forum Auto wordmark (red, or white for dark surfaces). */
export function BrandLogo({ className, variant = "red" }: { className?: string; variant?: "red" | "white" }) {
  return (
    <img
      src={variant === "white" ? "/brand/forum-auto-logo-white.png" : "/brand/forum-auto-logo.png"}
      alt="Forum Auto"
      width={560}
      height={182}
      className={cn("h-9 w-auto shrink-0 self-start select-none", className)}
      draggable={false}
    />
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      <BrandLogo className="h-11" />
      <span className="eyebrow text-[10px]">Espace ventes</span>
    </div>
  );
}
