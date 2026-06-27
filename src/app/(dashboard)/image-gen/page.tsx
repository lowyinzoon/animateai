"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PromptForm } from "@/components/image-gen/prompt-form";
import { ImageGallery } from "@/components/image-gen/image-gallery";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: string;
}

export default function ImageGenPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const supabase = createClient();

  const loadImages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "image")
      .order("created_at", { ascending: false });

    if (data) {
      setImages(
        data.map((asset) => ({
          id: asset.id,
          url: asset.file_url || "",
          prompt: asset.prompt || "",
          style: (asset.metadata as Record<string, string>)?.style_preset || "",
          createdAt: asset.created_at,
        }))
      );
    }
  }, [supabase]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleGenerate = async (params: {
    prompt: string;
    negative_prompt: string;
    width: number;
    height: number;
    style_preset: string;
  }) => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      toast.success("Image generated successfully!");

      // Reload images to show the new one
      await loadImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete image");
      return;
    }
    setImages((prev) => prev.filter((img) => img.id !== id));
    toast.success("Image deleted");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Image Generation</h1>
        <p className="text-muted-foreground mt-1">
          Create stunning images from text descriptions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Prompt Form */}
        <div className="space-y-4">
          <PromptForm onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>

        {/* Generated Images */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Generated Images</h2>
          <Separator className="mb-4" />
          <ImageGallery images={images} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
