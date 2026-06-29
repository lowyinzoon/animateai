"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ReferenceImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function ReferenceImageUpload({
  imageUrl,
  onImageChange,
}: ReferenceImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be under 10MB");
        return;
      }

      setIsUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", "characters");

        const res = await fetch("/api/upload-image", {
          method: "POST",
          body,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        onImageChange(data.url);
        toast.success("Reference image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [onImageChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <Label>Reference Image</Label>
      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <div className="aspect-square relative">
            <Image
              src={imageUrl}
              alt="Character reference"
              fill
              className="object-cover"
              sizes="300px"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => onImageChange(null)}
            aria-label="Remove reference image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload reference image"
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <div className="rounded-full bg-muted p-3">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                {isUploading ? "Uploading..." : "Drop image or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
            {!isUploading && (
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Browse
              </Button>
            )}
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
