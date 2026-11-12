import { Menu } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { BrandLogo } from "./BrandMark";

interface HeaderProps {
  onMenuClick: () => void;
}

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useUser();
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const name = user?.email?.split("@")[0];

  return (
    <header className="sticky top-0 z-30 px-4 pt-3 lg:px-6">
      <div className="flex h-14 items-center justify-between gap-3 rounded-full bg-card/85 px-2 pr-3 shadow-card backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 pl-2 lg:pl-3">
            <div className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {dateLabel}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {greeting(now)}
              {name ? <span className="text-foreground">, {name}</span> : null}
            </p>
          </div>
        </div>

        <BrandLogo className="h-6 lg:hidden" />
      </div>
    </header>
  );
}
