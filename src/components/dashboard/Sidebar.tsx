import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  MessageCircle,
  Users,
  Settings,
  X,
  Car,
  CarFrontIcon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { name: "Devis Requests", href: "/devis", icon: FileText, roles: ["admin", "sales"] },
  { name: "Appointments", href: "/appointments", icon: Calendar, roles: ["admin", "support"] },
  { name: "Messages", href: "/messages", icon: MessageCircle, roles: ["admin", "support"] },
  { name: "Test Drive", href: "/testdrive", icon: CarFrontIcon, roles: ["admin", "sales"] },
  { name: "Users", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "sales", "support"] },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const { user } = useUser();

  // Filter nav items based on role
  const filteredNav = navigation.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo and close button */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">Forum Auto</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-secondary-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
              {user?.role === "admin" ? (
                <span className="text-sm font-medium text-white">A</span>
              ) : user?.role === "sales" ? (
                <span className="text-sm font-medium text-white">S</span>
              ) : (
                <span className="text-sm font-medium text-white">U</span> // support
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{user?.role}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
