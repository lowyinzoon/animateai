"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  ImageIcon,
  FileText,
  Video,
  Users,
  Palette,
  LayoutDashboard,
  Film,
  FolderOpen,
  Plus,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    href: "/storyboard",
    title: "STORY\nANIME",
    icon: Film,
    bg: "bg-neutral-800/80",
    span: "col-span-1 row-span-2",
  },
  {
    href: "/video-gen",
    title: "VIDEO\nREIMAGINE",
    icon: Video,
    bg: "bg-gradient-to-br from-purple-900/60 to-fuchsia-900/40",
    span: "col-span-1 row-span-1",
    badge: "New",
  },
  {
    href: "/image-gen",
    title: "ITEM\nDESIGN",
    icon: ImageIcon,
    bg: "bg-gradient-to-br from-violet-900/40 to-purple-900/30",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/script",
    title: "SKILL\nMAKER",
    icon: FileText,
    bg: "bg-neutral-800/80",
    span: "col-span-1 row-span-2",
  },
  {
    href: "/character",
    title: "CHARACTER\nDESIGN",
    icon: Users,
    bg: "bg-gradient-to-br from-teal-900/40 to-emerald-900/30",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/scene",
    title: "PRODUCT\nAD",
    icon: Palette,
    bg: "bg-gradient-to-br from-cyan-900/40 to-blue-900/30",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/canvas",
    title: "ME AT THE\nWORLD CUP",
    icon: LayoutDashboard,
    bg: "bg-gradient-to-br from-yellow-900/30 to-amber-900/20",
    span: "col-span-1 row-span-2",
  },
  {
    href: "/assets",
    title: "ASSET\nLIBRARY",
    icon: FolderOpen,
    bg: "bg-neutral-800/60",
    span: "col-span-1 row-span-1",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] || "director";

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Section 1: Greeting - centered, large, with emoji */}
      <div className="pt-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          <span className="mr-3">&#x1F44B;</span>
          {getGreeting()}, {firstName}!
        </h1>
      </div>

      {/* Section 2: Projects Row */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-muted-foreground">Projects</h2>
          <Link
            href="/assets"
            className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* Start Creating card */}
          <Link href="/image-gen" className="shrink-0">
            <div className="flex h-[120px] w-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 transition-colors hover:border-neutral-500">
              <Plus className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Start Creating</span>
            </div>
          </Link>

          {/* Placeholder recent project cards */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-[120px] w-[180px] shrink-0 items-center justify-center rounded-xl bg-neutral-800/50"
            >
              <span className="text-xs text-neutral-600">Empty</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Highlights Bento Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-muted-foreground">Highlights</h2>
          <Link
            href="#"
            className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid auto-rows-[80px] grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className={feature.span}
            >
              <div
                className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-xl ${feature.bg} p-4 transition-all hover:brightness-125`}
              >
                {feature.badge && (
                  <span className="absolute top-3 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {feature.badge}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase leading-tight tracking-wide text-foreground whitespace-pre-line">
                    {feature.title}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <feature.icon className="absolute bottom-3 right-3 h-8 w-8 text-white/10" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
