"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clapperboard, Play, Sparkles } from "lucide-react";

interface Work {
  id: string;
  title: string;
  cover_url: string | null;
  video_url: string | null;
  author: string;
  created_at: string;
}

export default function GalleryPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Work | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (res.ok) setWorks(data.works || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Gallery</h1>
        <p className="text-muted-foreground mt-1">
          Films created and published by the community
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Loading…
        </div>
      ) : works.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Clapperboard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Nothing published yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Assemble a film in the workspace and hit Publish to be the first.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {works.map((w) => (
            <Card
              key={w.id}
              className="group relative cursor-pointer overflow-hidden"
              onClick={() => setActive(w)}
            >
              <div className="relative aspect-video bg-muted">
                {w.cover_url ? (
                  <Image
                    src={w.cover_url}
                    alt={w.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Clapperboard className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {w.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-white/90 p-3">
                      <Play className="h-5 w-5 fill-black text-black" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-medium">{w.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">@{w.author}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {active?.title}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                by @{active?.author}
              </span>
            </DialogTitle>
          </DialogHeader>
          {active?.video_url ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={active.video_url} controls autoPlay className="w-full rounded-lg bg-black" />
          ) : active?.cover_url ? (
            <div className="relative aspect-video w-full">
              <Image src={active.cover_url} alt={active.title} fill className="object-contain" sizes="768px" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
