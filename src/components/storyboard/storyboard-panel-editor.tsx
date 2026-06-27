"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SHOT_TYPES } from "@/types";
import type { StoryboardPanel, ShotType } from "@/types";
import { Wand2, GripVertical, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface StoryboardPanelEditorProps {
  panel: StoryboardPanel;
  panelNumber: number;
  storyboardId: string;
  stylePreset: string;
  onUpdate: (panel: StoryboardPanel) => void;
  onDelete: () => void;
  onImageGenerated: () => void;
  dragHandleProps?: {
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    draggable: boolean;
  };
}

export function StoryboardPanelEditor({
  panel,
  panelNumber,
  storyboardId,
  stylePreset,
  onUpdate,
  onDelete,
  onImageGenerated,
  dragHandleProps,
}: StoryboardPanelEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFieldChange = (field: keyof StoryboardPanel, value: string | number) => {
    onUpdate({ ...panel, [field]: value });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-storyboard-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboardId,
          panelId: panel.id,
          prompt: panel.image_prompt || panel.scene_description,
          shot_type: panel.shot_type,
          style_preset: stylePreset,
          width: 1536,
          height: 1024,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      toast.success(`Panel ${panelNumber} image generated!`);
      onImageGenerated();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="border border-border rounded-lg p-4 space-y-3 bg-card"
      {...(dragHandleProps ? {
        onDragOver: dragHandleProps.onDragOver,
        onDragEnd: dragHandleProps.onDragEnd,
      } : {})}
    >
      <div className="flex items-center gap-2">
        {dragHandleProps && (
          <div
            className="cursor-grab active:cursor-grabbing"
            draggable={dragHandleProps.draggable}
            onDragStart={dragHandleProps.onDragStart}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <Badge variant="outline" className="text-xs">
          Panel {panelNumber}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {SHOT_TYPES.find((s) => s.value === panel.shot_type)?.label || panel.shot_type}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {panel.duration_seconds}s
        </Badge>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDelete}
          aria-label="Delete panel"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Image area */}
        <div className="space-y-2">
          <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted relative">
            {panel.image_url ? (
              <Image
                src={panel.image_url}
                alt={`Panel ${panelNumber}`}
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            disabled={isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="mr-1 h-3 w-3" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-1 h-3 w-3" />
                {panel.image_url ? "Regenerate" : "Generate Image"}
              </>
            )}
          </Button>
        </div>

        {/* Fields */}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Scene Description</Label>
            <Textarea
              value={panel.scene_description}
              onChange={(e) => handleFieldChange("scene_description", e.target.value)}
              rows={2}
              className="resize-none text-xs"
              placeholder="What's happening in this panel..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Dialogue</Label>
              <Input
                value={panel.dialogue}
                onChange={(e) => handleFieldChange("dialogue", e.target.value)}
                className="text-xs"
                placeholder="Character dialogue..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action Notes</Label>
              <Input
                value={panel.action_notes}
                onChange={(e) => handleFieldChange("action_notes", e.target.value)}
                className="text-xs"
                placeholder="Camera/action notes..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Shot Type</Label>
              <Select
                value={panel.shot_type}
                onValueChange={(v) => handleFieldChange("shot_type", (v ?? "medium") as ShotType)}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOT_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duration (s)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={panel.duration_seconds}
                onChange={(e) => handleFieldChange("duration_seconds", parseInt(e.target.value) || 3)}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Image Prompt</Label>
              <Input
                value={panel.image_prompt}
                onChange={(e) => handleFieldChange("image_prompt", e.target.value)}
                className="text-xs h-8"
                placeholder="Custom prompt..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
