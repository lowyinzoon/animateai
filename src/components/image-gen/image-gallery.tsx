"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Expand, Trash2 } from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: string;
}

interface ImageGalleryProps {
  images: GeneratedImage[];
  onDelete?: (id: string) => void;
}

export function ImageGallery({ images, onDelete }: ImageGalleryProps) {
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  const handleDownload = async (image: GeneratedImage) => {
    const response = await fetch(image.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `animateai-${image.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Expand className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No images yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Generate your first image using the form
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden group relative">
            <div className="aspect-square relative">
              <Image
                src={image.url}
                alt={image.prompt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setPreviewImage(image)}
                >
                  <Expand className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(image)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => onDelete(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {image.prompt}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{image.style}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <div className="relative aspect-square max-h-[70vh] w-full">
                <Image
                  src={previewImage.url}
                  alt={previewImage.prompt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Prompt:</strong> {previewImage.prompt}</p>
                <p className="text-sm text-muted-foreground"><strong>Style:</strong> {previewImage.style}</p>
              </div>
              <Button onClick={() => handleDownload(previewImage)} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
