"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ImageIcon,
  Video,
  FileText,
  Users,
  Palette,
  LayoutDashboard,
  Film,
  FolderOpen,
  User,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/image-gen", label: "Image Generation", icon: ImageIcon },
  { href: "/video-gen", label: "Video Generation", icon: Video },
  { href: "/script", label: "Script Writing", icon: FileText },
  { href: "/character", label: "Character Design", icon: Users },
  { href: "/canvas", label: "Canvas Editor", icon: LayoutDashboard },
  { href: "/scene", label: "Scene Design", icon: Palette },
  { href: "/storyboard", label: "Story Films", icon: Film },
  { href: "/assets", label: "Asset Library", icon: FolderOpen },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/home" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">AnimateAI</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/home" className="mx-auto">
            <Sparkles className="h-6 w-6 text-primary" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("h-8 w-8", collapsed && "mx-auto")}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="space-y-1 px-2 py-2">
          {!collapsed && (
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Create
            </p>
          )}
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <Separator className="my-3" />

          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/profile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Profile" : undefined}
          >
            <User className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>
        </div>
      </ScrollArea>
    </aside>
  );
}
