"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, ImageIcon } from "lucide-react";
import type { Asset } from "@/types";

interface CanvasAssetBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (url: string) => void;
}

export function CanvasAssetBrowser({
  open,
  onOpenChange,
  onSelectImage,
}: CanvasAssetBrowserProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "image")
        .order("created_at", { ascending: false });

      if (data) {
        setAssets(data);
      }
      setLoading(false);
    };

    load();
  }, [open, supabase]);

  const handleSelect = (asset: Asset) => {
    if (!asset.file_url) {
      toast.error("Asset has no file URL");
      return;
    }
    onSelectImage(asset.file_url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Image Asset</DialogTitle>
          <DialogDescription>
            Select an image from your asset library to add to the canvas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No images found. Generate some images first!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-3 gap-3 p-1">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className="group relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                >
                  {asset.file_url && (
                    <Image
                      src={asset.file_url}
                      alt={asset.name || "Asset"}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                    <p className="w-full text-xs text-white bg-black/50 px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.name || "Untitled"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
