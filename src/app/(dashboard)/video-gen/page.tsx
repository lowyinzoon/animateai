"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";
import { Video, Download, Trash2 } from "lucide-react";

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const RESOLUTIONS = [
  { value: "480p", label: "480p" },
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
];

const DURATIONS = [
  { value: "4", label: "4 seconds" },
  { value: "5", label: "5 seconds" },
  { value: "8", label: "8 seconds" },
  { value: "10", label: "10 seconds" },
  { value: "15", label: "15 seconds" },
];

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  state: string;
  taskId?: string;
  createdAt: string;
}

export default function VideoGenPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [duration, setDuration] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const supabase = createClient();

  const loadVideos = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "video")
      .order("created_at", { ascending: false });

    if (data) {
      setVideos(
        data.map((asset) => {
          const meta = asset.metadata as Record<string, string>;
          return {
            id: asset.id,
            url: asset.file_url || "",
            prompt: asset.prompt || "",
            state: meta?.state || "success",
            taskId: meta?.taskId,
            createdAt: asset.created_at,
          };
        })
      );
    }
  }, [supabase]);

  useEffect(() => {
    loadVideos();
    return () => {
      pollingRef.current.forEach((timer) => clearInterval(timer));
    };
  }, [loadVideos]);

  // Start polling for any generating videos on load
  useEffect(() => {
    videos.forEach((video) => {
      if (video.state === "generating" && video.taskId && !pollingRef.current.has(video.id)) {
        startPolling(video.taskId, video.id);
      }
    });
  }, [videos]);

  const startPolling = (taskId: string, assetId: string) => {
    if (pollingRef.current.has(assetId)) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/generate-video?task_id=${encodeURIComponent(taskId)}&asset_id=${encodeURIComponent(assetId)}`
        );
        const data = await res.json();

        if (data.state === "success") {
          clearInterval(timer);
          pollingRef.current.delete(assetId);
          toast.success("Video generated successfully!");
          await loadVideos();
        } else if (data.state === "fail") {
          clearInterval(timer);
          pollingRef.current.delete(assetId);
          toast.error(data.fail_msg || "Video generation failed");
          await loadVideos();
        }
      } catch {
        // Keep polling on network errors
      }
    }, 10000); // Poll every 10 seconds

    pollingRef.current.set(assetId, timer);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image_url: imageUrl.trim() || undefined,
          duration: parseInt(duration),
          aspect_ratio: aspectRatio,
          resolution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      toast.success("Video generation started! This may take a few minutes.");
      await loadVideos();

      if (data.task_id && data.asset_id) {
        startPolling(data.task_id, data.asset_id);
      }

      setPrompt("");
      setImageUrl("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (pollingRef.current.has(id)) {
      clearInterval(pollingRef.current.get(id));
      pollingRef.current.delete(id);
    }
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete video");
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== id));
    toast.success("Video deleted");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Video Generation</h1>
        <p className="text-muted-foreground mt-1">
          Create videos from text prompts using Seedance 2.0
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-prompt">Prompt</Label>
            <Textarea
              id="video-prompt"
              placeholder="Describe the video you want to create... e.g., 'A cinematic drone shot flying over a futuristic city at sunset'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-url">Reference Image URL (optional)</Label>
            <Input
              id="image-url"
              placeholder="https://... (use as first frame)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v ?? "16:9")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={(v) => setResolution(v ?? "720p")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v ?? "5")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating || !prompt.trim()}>
            {isGenerating ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Starting...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </form>

        {/* Video List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Generated Videos</h2>
          <Separator className="mb-4" />

          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No videos yet. Generate your first one!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-lg border bg-card overflow-hidden"
                >
                  {video.state === "generating" || video.state === "waiting" || video.state === "queuing" ? (
                    <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner className="h-8 w-8" />
                      <span className="text-sm text-muted-foreground capitalize">
                        {video.state}...
                      </span>
                    </div>
                  ) : video.state === "fail" ? (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <span className="text-sm text-destructive">Generation failed</span>
                    </div>
                  ) : video.url ? (
                    <video
                      src={video.url}
                      controls
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">No video available</span>
                    </div>
                  )}

                  <div className="p-3">
                    <p className="text-sm line-clamp-2">{video.prompt}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1">
                        {video.url && (
                          <a
                            href={video.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
