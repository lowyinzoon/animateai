"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { IMAGE_SIZES } from "@/types";
import type { Asset, SceneMetadata } from "@/types";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

interface SceneImageGeneratorProps {
  scene: Asset;
  onImageGenerated: () => void;
}

export function SceneImageGenerator({
  scene,
  onImageGenerated,
}: SceneImageGeneratorProps) {
  const meta = scene.metadata as unknown as SceneMetadata;
  const [prompt, setPrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState("1536x1024");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const size = IMAGE_SIZES.find((s) => s.value === selectedSize) || IMAGE_SIZES[1];

      const response = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId: scene.id,
          prompt: prompt.trim(),
          width: size.width,
          height: size.height,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      toast.success("Scene image generated!");
      setPrompt("");
      onImageGenerated();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const settingsSummary = [
    meta?.environment,
    meta?.time_of_day,
    meta?.weather !== "clear" ? meta?.weather : null,
    meta?.mood,
    meta?.lighting,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      {settingsSummary && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Scene settings:</span>{" "}
            {settingsSummary}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Style: {meta?.style_preset?.replace(/-/g, " ") || "digital art"} | Palette: {meta?.color_palette || "warm"}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="scene-gen-prompt">Prompt</Label>
        <Textarea
          id="scene-gen-prompt"
          placeholder="Describe what you want in this scene... (e.g., 'A grand castle on a hilltop with a winding path leading to it')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Scene settings will be automatically included in the generation prompt.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Image Size</Label>
        <Select
          value={selectedSize}
          onValueChange={(v) => setSelectedSize(v ?? "1536x1024")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        disabled={isGenerating || !prompt.trim()}
        onClick={handleGenerate}
      >
        {isGenerating ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Scene Image
          </>
        )}
      </Button>
    </div>
  );
}
