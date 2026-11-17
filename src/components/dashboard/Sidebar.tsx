import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  Settings,
  X,
  CarFront,
  FileText,
  Mail,
  LogOut,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { BrandLockup } from "./BrandMark";
import { useBrands } from "@/lib/brands";

const navigation = [
  { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { name: "Demandes de devis", href: "/devis", icon: FileText, roles: ["admin", "sales"] },
  { name: "Messages", href: "/messages", icon: MessageCircle, roles: ["admin", "support"] },
  { name: "Test drives", href: "/testdrive", icon: CarFront, roles: ["admin", "sales"] },
  { name: "Utilisateurs", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Newsletter", href: "/newsletters", icon: Mail, roles: ["admin"] },
  { name: "Export & Rapports", href: "/exports", icon: FileBarChart, roles: ["admin"] },
  { name: "Paramètres", href: "/settings", icon: Settings, roles: ["admin", "sales", "support"] },
];

const ROLE_LABEL: Record<string, string> = { admin: "Administrateur", sales: "Commercial", support: "Support" };

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useUser();
  const { labelOf } = useBrands();
  const brandSummary =
    user && user.brands.length > 0
      ? user.brands.length <= 2
        ? user.brands.map((b) => labelOf(b)).join(", ")
        : `${user.brands.length} marques`
      : "";

  const filteredNav = navigation.filter((item) => item.roles.includes(user?.role || ""));
  const initial = (user?.email?.[0] ?? user?.role?.[0] ?? "u").toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-3 left-3 z-50 flex w-64 flex-col rounded-3xl bg-sidebar shadow-card transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        )}
      >
        <div className="flex items-start justify-between px-5 pb-2 pt-6">
          <BrandLockup />
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 hover:bg-secondary lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="eyebrow px-6 pb-2 pt-3">Espace de travail</div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={cn("sidebar-item", isActive && "sidebar-item-active")}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span className="font-medium">{item.name}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl bg-secondary p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.email || "Utilisateur"}</p>
              <p
                className="eyebrow mt-0.5 truncate text-[10px]"
                title={user?.brands.map((b) => labelOf(b)).join(", ")}
              >
                {ROLE_LABEL[user?.role ?? ""] ?? user?.role}
                {brandSummary ? ` · ${brandSummary}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[#fbe2da] hover:text-[#9a3415]"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
