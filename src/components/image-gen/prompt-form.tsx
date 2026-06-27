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
import { StylePresets } from "./style-presets";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { IMAGE_SIZES } from "@/types";
import { Wand2, ChevronDown, ChevronUp } from "lucide-react";

interface PromptFormProps {
  onGenerate: (params: {
    prompt: string;
    negative_prompt: string;
    width: number;
    height: number;
    style_preset: string;
  }) => void;
  isGenerating: boolean;
}

export function PromptForm({ onGenerate, isGenerating }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState("1024x1024");
  const [stylePreset, setStylePreset] = useState("digital-art");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const size = IMAGE_SIZES.find((s) => s.value === selectedSize) || IMAGE_SIZES[2];
    onGenerate({
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim(),
      width: size.width,
      height: size.height,
      style_preset: stylePreset,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Describe the image you want to create... e.g., 'A magical forest with glowing mushrooms and fairy lights at twilight'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="resize-none"
          required
        />
      </div>

      <StylePresets selected={stylePreset} onSelect={setStylePreset} />

      <div className="space-y-2">
        <Label>Image Size</Label>
        <Select value={selectedSize} onValueChange={(v) => setSelectedSize(v ?? "1024x1024")}>
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

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Advanced Options
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showAdvanced && (
        <div className="space-y-2">
          <Label htmlFor="negative-prompt">Negative Prompt</Label>
          <Textarea
            id="negative-prompt"
            placeholder="What to avoid... e.g., 'blurry, low quality, distorted, ugly'"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isGenerating || !prompt.trim()}>
        {isGenerating ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>
    </form>
  );
}
