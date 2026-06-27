"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Expand, Trash2 } from "lucide-react";

interface ImageCardProps {
  src: string;
  alt: string;
  subtitle?: string;
  onPreview?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function ImageCard({
  src,
  alt,
  subtitle,
  onPreview,
  onDownload,
  onDelete,
}: ImageCardProps) {
  return (
    <Card className="overflow-hidden group relative">
      <div className="aspect-square relative">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onPreview && (
            <Button size="icon" variant="secondary" onClick={onPreview}>
              <Expand className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button size="icon" variant="secondary" onClick={onDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {(alt || subtitle) && (
        <div className="p-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{alt}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      )}
    </Card>
  );
}
