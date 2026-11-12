import { cn } from "@/lib/utils";

export type StatsTone = "ink" | "lime" | "amber" | "stone" | "coral";

type StatsCardProps = {
  title: React.ReactNode;
  value: React.ReactNode;
  icon: React.ElementType;
  description?: React.ReactNode;
  tone?: StatsTone;
  className?: string;
};

const TONES: Record<StatsTone, string> = {
  ink: "bg-primary text-lime",
  lime: "bg-[#e6f5c2] text-[#3d5a0c]",
  amber: "bg-[#f6ebc8] text-[#7a5a0a]",
  stone: "bg-[#e7e7e4] text-[#3a3a36]",
  coral: "bg-[#fbe2da] text-[#9a3415]",
};

export function StatsCard({ title, value, icon: Icon, description, tone = "stone", className }: StatsCardProps) {
  return (
    <div className={cn("stat-card flex min-h-[150px] flex-col", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        {Icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", TONES[tone])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-auto pt-6">
        <div className="text-4xl font-light tabular-nums tracking-tight text-foreground">{value}</div>
        {description && <p className="eyebrow mt-2">{description}</p>}
      </div>
    </div>
  );
}
