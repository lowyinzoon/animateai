"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Expand, Download, ImageIcon } from "lucide-react";
import type { Asset, SceneMetadata, SceneGeneratedImage } from "@/types";

interface SceneGalleryProps {
  scene: Asset;
  onUpdate: () => void;
}

export function SceneGallery({ scene, onUpdate }: SceneGalleryProps) {
  const meta = scene.metadata as unknown as SceneMetadata;
  const images = meta?.generated_images || [];
  const [previewImage, setPreviewImage] = useState<SceneGeneratedImage | null>(null);
  const supabase = createClient();

  const handleDeleteImage = async (index: number) => {
    try {
      const updatedImages = [...images];
      updatedImages.splice(index, 1);

      const updatedMeta = {
        ...meta,
        generated_images: updatedImages,
      };

      const { error } = await supabase
        .from("assets")
        .update({
          metadata: updatedMeta as unknown as Record<string, unknown>,
        })
        .eq("id", scene.id);

      if (error) throw error;
      toast.success("Image removed");
      setPreviewImage(null);
      onUpdate();
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scene.name || "scene"}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download image");
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-3">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No images yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Use the Generate tab to create scene images
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div
            key={`${img.url}-${idx}`}
            className="group relative rounded-lg overflow-hidden border border-border"
          >
            <div className="aspect-square relative">
              <Image
                src={img.url}
                alt={img.prompt || "Scene image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => setPreviewImage(img)}
                  aria-label="Preview image"
                >
                  <Expand className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => handleDownload(img.url, idx)}
                  aria-label="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => handleDeleteImage(idx)}
                  aria-label="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground p-1.5 truncate">
              {img.prompt}
            </p>
          </div>
        ))}
      </div>

      <Dialog
        open={!!previewImage}
        onOpenChange={() => setPreviewImage(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Scene Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-3">
              <div className="relative aspect-video max-h-[70vh] w-full">
                <Image
                  src={previewImage.url}
                  alt="Scene preview"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(previewImage.createdAt).toLocaleString()}
              </span>
              <p className="text-sm text-muted-foreground">
                {previewImage.prompt}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
