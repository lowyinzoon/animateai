"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ImageIcon,
  FileText,
  Video,
  Users,
  Palette,
  LayoutDashboard,
  Film,
  FolderOpen,
  ArrowRight,
  Lock,
} from "lucide-react";

const features = [
  {
    href: "/image-gen",
    title: "AI Image Generation",
    description: "Create stunning images from text prompts with multiple style presets",
    icon: ImageIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    available: true,
  },
  {
    href: "/script",
    title: "AI Script Writing",
    description: "Generate compelling scripts and stories with AI assistance",
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    available: true,
  },
  {
    href: "/assets",
    title: "Asset Library",
    description: "Browse and manage all your generated images and scripts",
    icon: FolderOpen,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    available: true,
  },
  {
    href: "/video-gen",
    title: "AI Video Generation",
    description: "Transform images into dynamic videos with AI",
    icon: Video,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    available: false,
  },
  {
    href: "/character",
    title: "Character Design",
    description: "Design consistent characters for your animations",
    icon: Users,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    available: false,
  },
  {
    href: "/scene",
    title: "Scene Design",
    description: "Create detailed scene backgrounds and environments",
    icon: Palette,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    available: false,
  },
  {
    href: "/canvas",
    title: "Canvas Editor",
    description: "Drag-and-drop editor for composing scenes",
    icon: LayoutDashboard,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    available: true,
  },
  {
    href: "/storyboard",
    title: "Story Films",
    description: "Create multi-panel storyboards from your scripts",
    icon: Film,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    available: false,
  },
];

export default function HomePage() {
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Creator";

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground mt-1">
          What would you like to create today?
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Images Created</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scripts Written</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assets</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">AI Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer relative overflow-hidden">
                {!feature.available && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Soon
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-2`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {feature.available ? "Get started" : "Coming soon"}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
