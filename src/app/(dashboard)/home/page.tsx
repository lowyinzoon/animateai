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
  ArrowRight,
} from "lucide-react";

const features = [
  {
    href: "/image-gen",
    title: "AI Image Generation",
    description: "Create stunning images from text prompts",
    icon: ImageIcon,
    gradient: "from-pink-500/20 to-purple-500/20",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
    span: "col-span-2 row-span-2",
  },
  {
    href: "/character",
    title: "Character Design",
    description: "Design consistent characters",
    icon: Users,
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    span: "col-span-1 row-span-2",
  },
  {
    href: "/script",
    title: "Script Writing",
    description: "AI-powered scripts & stories",
    icon: FileText,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/video-gen",
    title: "Video Generation",
    description: "Transform images into videos",
    icon: Video,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/scene",
    title: "Scene Design",
    description: "Create detailed environments",
    icon: Palette,
    gradient: "from-amber-500/20 to-orange-500/20",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/canvas",
    title: "Canvas Editor",
    description: "Compose scenes visually",
    icon: LayoutDashboard,
    gradient: "from-cyan-500/20 to-sky-500/20",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/storyboard",
    title: "Story Films",
    description: "Multi-panel storyboards",
    icon: Film,
    gradient: "from-rose-500/20 to-red-500/20",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
    span: "col-span-1 row-span-1",
  },
  {
    href: "/assets",
    title: "Asset Library",
    description: "Manage all your creations",
    icon: FolderOpen,
    gradient: "from-orange-500/20 to-yellow-500/20",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
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
    user?.user_metadata?.full_name?.split(" ")[0] || "Creator";

  return (
    <div className="space-y-8">
      {/* Section 1: Greeting */}
      <div>
        <h1 className="text-3xl font-bold">
          {getGreeting()},{" "}
          <span className="text-gradient-pink">{firstName}</span>!
        </h1>
        <p className="mt-1 text-muted-foreground">
          What will you create today?
        </p>
      </div>

      {/* Section 2: Projects Row */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Link
            href="/assets"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Start Creating card */}
          <Link href="/image-gen" className="shrink-0">
            <div className="flex h-[140px] w-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card transition-colors hover:border-primary/50 hover:bg-accent">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Start Creating
              </span>
            </div>
          </Link>

          {/* Placeholder recent project cards */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-[140px] w-[200px] shrink-0 items-center justify-center rounded-xl bg-card border border-border"
            >
              <span className="text-xs text-muted-foreground">
                No project yet
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Highlights Bento Grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Highlights</h2>
        <div className="grid auto-rows-[140px] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className={feature.span}
            >
              <div
                className={`card-glow group relative flex h-full flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br ${feature.gradient} border border-border p-4 transition-all hover:border-primary/30`}
              >
                <div>
                  <div
                    className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBg}`}
                  >
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
