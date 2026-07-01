"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Compass,
  Plus,
  FolderOpen,
  LayoutDashboard,
  FileText,
  Clapperboard,
  Settings,
  Trash2,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

const primaryNav = [
  { href: "/home", label: "Explore", icon: Compass },
  { href: "/workspace", label: "New", icon: Plus },
  { href: "/gallery", label: "Gallery", icon: Clapperboard },
  { href: "/assets", label: "Projects", icon: FolderOpen },
  { href: "/canvas", label: "Assets", icon: LayoutDashboard },
  { href: "/script", label: "Skills", icon: FileText },
];

const bottomNav = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "#", label: "Trash", icon: Trash2 },
  { href: "#", label: "Discord", icon: MessageCircle },
  { href: "#", label: "Help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[68px] flex-col items-center border-r border-border bg-sidebar py-4">
      {/* Logo */}
      <Link
        href="/home"
        className="mb-5 flex h-8 w-8 items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-foreground" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </Link>

      {/* Primary navigation */}
      <nav className="flex flex-col items-center gap-0.5">
        {primaryNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-14 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom utility navigation */}
      <nav className="flex flex-col items-center gap-0.5">
        {bottomNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex w-14 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span className="text-[10px] leading-tight">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
