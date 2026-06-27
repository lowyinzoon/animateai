"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      <div
        className={cn(
          "lg:block",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="transition-all duration-300 lg:pl-[68px]">
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
