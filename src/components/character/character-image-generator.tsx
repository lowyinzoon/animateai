"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  IMAGE_SIZES,
  CHARACTER_CATEGORIES,
  CHARACTER_SUGGESTIONS,
} from "@/types";
import type { CharacterCategory, Asset, CharacterMetadata } from "@/types";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

interface CharacterImageGeneratorProps {
  character: Asset;
  onImageGenerated: () => void;
}

export function CharacterImageGenerator({
  character,
  onImageGenerated,
}: CharacterImageGeneratorProps) {
  const meta = character.metadata as unknown as CharacterMetadata;
  const [category, setCategory] = useState<CharacterCategory>("turnaround");
  const [prompt, setPrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState("1024x1024");
  const [isGenerating, setIsGenerating] = useState(false);

  const suggestions = CHARACTER_SUGGESTIONS[category];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const size = IMAGE_SIZES.find((s) => s.value === selectedSize) || IMAGE_SIZES[0];

      const response = await fetch("/api/generate-character-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          prompt: prompt.trim(),
          category,
          label: prompt.trim().substring(0, 50),
          width: size.width,
          height: size.height,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      toast.success("Character image generated!");
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

  if (!meta?.appearance_prompt) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Add an appearance description to the character profile first to
          generate consistent images.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {CHARACTER_CATEGORIES.map((cat) => (
            <Badge
              key={cat.value}
              variant={category === cat.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setCategory(cat.value);
                setPrompt("");
              }}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Quick suggestions
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-primary/20"
                onClick={() => setPrompt(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="gen-prompt">Prompt</Label>
        <Textarea
          id="gen-prompt"
          placeholder={`Describe the ${category} you want to generate...`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Style: {meta.style_preset} | Appearance description will be
          automatically included.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Image Size</Label>
        <Select
          value={selectedSize}
          onValueChange={(v) => setSelectedSize(v ?? "1024x1024")}
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
            Generate {CHARACTER_CATEGORIES.find((c) => c.value === category)?.label}
          </>
        )}
      </Button>
    </div>
  );
}
