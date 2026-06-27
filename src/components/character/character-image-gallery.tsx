"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Star, Trash2, Expand, ImageIcon } from "lucide-react";
import type { Asset, CharacterMetadata, CharacterGeneratedImage, CharacterCategory } from "@/types";
import { CHARACTER_CATEGORIES } from "@/types";

interface CharacterImageGalleryProps {
  character: Asset;
  onUpdate: () => void;
}

export function CharacterImageGallery({
  character,
  onUpdate,
}: CharacterImageGalleryProps) {
  const meta = character.metadata as unknown as CharacterMetadata;
  const images = meta?.generatedImages || [];
  const [previewImage, setPreviewImage] = useState<CharacterGeneratedImage | null>(null);
  const supabase = createClient();

  const imagesByCategory = CHARACTER_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.value] = images.filter((img) => img.category === cat.value);
      return acc;
    },
    {} as Record<CharacterCategory, CharacterGeneratedImage[]>
  );

  const handleSetReference = async (imageUrl: string) => {
    try {
      const updatedMeta = {
        ...meta,
        referenceImageUrl: imageUrl,
      };

      const { error } = await supabase
        .from("assets")
        .update({
          file_url: imageUrl,
          metadata: updatedMeta as unknown as Record<string, unknown>,
        })
        .eq("id", character.id);

      if (error) throw error;
      toast.success("Reference image updated");
      onUpdate();
    } catch {
      toast.error("Failed to update reference image");
    }
  };

  const handleDeleteImage = async (index: number) => {
    try {
      const updatedImages = [...images];
      updatedImages.splice(index, 1);

      const updatedMeta = {
        ...meta,
        generatedImages: updatedImages,
      };

      const { error } = await supabase
        .from("assets")
        .update({
          metadata: updatedMeta as unknown as Record<string, unknown>,
        })
        .eq("id", character.id);

      if (error) throw error;
      toast.success("Image removed");
      setPreviewImage(null);
      onUpdate();
    } catch {
      toast.error("Failed to delete image");
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
          Use the Generate tab to create character images
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {CHARACTER_CATEGORIES.map((cat) => {
        const catImages = imagesByCategory[cat.value];
        if (catImages.length === 0) return null;

        return (
          <div key={cat.value}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium">{cat.label}</h4>
              <Badge variant="secondary" className="text-xs">
                {catImages.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {catImages.map((img, idx) => {
                const globalIndex = images.indexOf(img);
                return (
                  <div
                    key={`${img.url}-${idx}`}
                    className="group relative rounded-lg overflow-hidden border border-border"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={img.url}
                        alt={img.label}
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
                          onClick={() => handleSetReference(img.url)}
                          aria-label="Set as reference image"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-9 w-9 sm:h-10 sm:w-10"
                          onClick={() => handleDeleteImage(globalIndex)}
                          aria-label="Delete image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground p-1.5 truncate">
                      {img.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog
        open={!!previewImage}
        onOpenChange={() => setPreviewImage(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.label || "Preview"}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[70vh] w-full">
                <Image
                  src={previewImage.url}
                  alt={previewImage.label}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{previewImage.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(previewImage.createdAt).toLocaleString()}
                </span>
              </div>
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
