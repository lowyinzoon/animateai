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
  Trash2,
  MessageCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const primaryNav = [
  { href: "/home", label: "Explore", icon: Compass },
  { href: "/image-gen", label: "New", icon: Plus },
  { href: "/assets", label: "Projects", icon: FolderOpen },
  { href: "/canvas", label: "Canvas", icon: LayoutDashboard },
  { href: "/script", label: "Skills", icon: FileText },
];

const bottomNav = [
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
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary"
      >
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </Link>

      {/* Primary navigation */}
      <nav className="flex flex-col items-center gap-1">
        <TooltipProvider>
          {primaryNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={<Link href={item.href} />}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom utility navigation */}
      <nav className="flex flex-col items-center gap-1">
        <TooltipProvider>
          {bottomNav.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger
                render={<Link href={item.href} />}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
