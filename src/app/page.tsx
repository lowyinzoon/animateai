import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Sparkles,
  ImageIcon,
  FileText,
  Video,
  ArrowRight,
  Zap,
  Shield,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">AnimateAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants()}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Zap className="h-4 w-4 mr-2" />
            Powered by AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Create stunning animations
            <br />
            <span className="text-primary">with AI</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            AnimateAI is your all-in-one platform for AI-powered image generation,
            script writing, character design, and video creation. Bring your stories to life.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-3 text-muted-foreground">
              A complete toolkit for AI-powered creative production
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border p-8 bg-card">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold">AI Image Generation</h3>
              <p className="mt-2 text-muted-foreground">
                Generate stunning images from text prompts. Choose from multiple styles
                including anime, photographic, digital art, and more.
              </p>
            </div>
            <div className="rounded-xl border border-border p-8 bg-card">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold">AI Script Writing</h3>
              <p className="mt-2 text-muted-foreground">
                Generate compelling scripts with AI. Choose genres, set the tone,
                and let AI craft your story with professional formatting.
              </p>
            </div>
            <div className="rounded-xl border border-border p-8 bg-card">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold">AI Video Generation</h3>
              <p className="mt-2 text-muted-foreground">
                Transform images into dynamic videos. Create animations from your
                generated assets with AI-powered motion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Fast Generation</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate images in seconds and scripts in real-time with streaming AI
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Multiple Styles</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose from 10+ art styles and multiple genres for diverse creative output
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Secure & Private</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your creations are private and secure with row-level security on all data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Ready to create?</h2>
          <p className="mt-3 text-muted-foreground">
            Join AnimateAI and start bringing your creative visions to life with AI.
          </p>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "mt-8")}
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">AnimateAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Supabase & AI
          </p>
        </div>
      </footer>
    </div>
  );
}
