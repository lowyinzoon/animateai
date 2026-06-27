"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  Download,
  Expand,
  ImageIcon,
  FileText,
  Video,
  FolderOpen,
  LayoutDashboard,
  Users,
  Film,
} from "lucide-react";
import type { Asset, AssetType } from "@/types";

const typeIcons: Record<AssetType, React.ReactNode> = {
  image: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  script: <FileText className="h-4 w-4" />,
  character: <Users className="h-4 w-4" />,
  scene: <ImageIcon className="h-4 w-4" />,
  canvas: <LayoutDashboard className="h-4 w-4" />,
  storyboard: <Film className="h-4 w-4" />,
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const supabase = createClient();

  const loadAssets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setAssets(data);
    }
  }, [supabase]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    let filtered = assets;

    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name?.toLowerCase().includes(query) ||
          a.prompt?.toLowerCase().includes(query)
      );
    }

    setFilteredAssets(filtered);
  }, [assets, filterType, searchQuery]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete asset");
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success("Asset deleted");
  };

  const handleDownload = async (asset: Asset) => {
    if (!asset.file_url) return;

    const response = await fetch(asset.file_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.name || asset.id}.${asset.type === "image" ? "png" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Asset Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage all your generated content
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="script">Scripts</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="character">Characters</SelectItem>
            <SelectItem value="scene">Scenes</SelectItem>
            <SelectItem value="storyboard">Storyboards</SelectItem>
            <SelectItem value="canvas">Canvas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No assets found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery || filterType !== "all"
              ? "Try changing your filters"
              : "Start creating to build your asset library"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className="overflow-hidden group relative"
            >
              {asset.type === "image" && asset.file_url ? (
                <div className="aspect-square relative">
                  <Image
                    src={asset.file_url}
                    alt={asset.name || "Generated image"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setPreviewAsset(asset)}
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleDownload(asset)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-muted">
                  <div className="text-center p-4">
                    {typeIcons[asset.type]}
                    <p className="text-sm text-muted-foreground mt-2">
                      {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                    </p>
                  </div>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium line-clamp-1">
                    {asset.name || "Untitled"}
                  </p>
                  <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                    {asset.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.name || "Asset Preview"}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              {previewAsset.type === "image" && previewAsset.file_url && (
                <div className="relative aspect-square max-h-[70vh] w-full">
                  <Image
                    src={previewAsset.file_url}
                    alt={previewAsset.name || "Preview"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              )}
              {previewAsset.prompt && (
                <p className="text-sm">
                  <strong>Prompt:</strong> {previewAsset.prompt}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Created: {new Date(previewAsset.created_at).toLocaleString()}
              </p>
              {previewAsset.file_url && (
                <Button
                  onClick={() => handleDownload(previewAsset)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
