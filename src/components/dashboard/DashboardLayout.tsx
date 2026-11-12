import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background-secondary">
      {/* Soft lime wash in the top-right corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-subtle opacity-70"
      />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="relative lg:pl-[17.5rem]">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 pb-10 pt-4 lg:px-6">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
