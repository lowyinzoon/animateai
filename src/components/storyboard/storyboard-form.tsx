"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  IMAGE_STYLES,
  STORYBOARD_ASPECT_RATIOS,
} from "@/types";
import type { StoryboardMetadata } from "@/types";
import { Save, X } from "lucide-react";

export interface StoryboardFormData {
  name: string;
  description: string;
  style_preset: string;
  aspect_ratio: string;
}

interface StoryboardFormProps {
  initialData?: StoryboardFormData;
  onSubmit: (data: StoryboardFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const defaultFormData: StoryboardFormData = {
  name: "",
  description: "",
  style_preset: "digital-art",
  aspect_ratio: "16:9",
};

export function StoryboardForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: StoryboardFormProps) {
  const [formData, setFormData] = useState<StoryboardFormData>(
    initialData || defaultFormData
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Edit Storyboard" : "New Storyboard"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sb-name">Title *</Label>
        <Input
          id="sb-name"
          placeholder="Storyboard title"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sb-desc">Description</Label>
        <Textarea
          id="sb-desc"
          placeholder="Brief description of this storyboard..."
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Style Preset</Label>
        <Select
          value={formData.style_preset}
          onValueChange={(v) =>
            setFormData((prev) => ({ ...prev, style_preset: v ?? "digital-art" }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Aspect Ratio</Label>
        <Select
          value={formData.aspect_ratio}
          onValueChange={(v) =>
            setFormData((prev) => ({ ...prev, aspect_ratio: v ?? "16:9" }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STORYBOARD_ASPECT_RATIOS.map((ar) => (
              <SelectItem key={ar.value} value={ar.value}>
                {ar.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSaving || !formData.name.trim()}
      >
        {isSaving ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? "Update Storyboard" : "Create Storyboard"}
          </>
        )}
      </Button>
    </form>
  );
}

export function storyboardFormDataToMetadata(
  formData: StoryboardFormData,
  existingPanels?: StoryboardMetadata["panels"],
  sourceScriptId?: string | null
): StoryboardMetadata {
  return {
    title: formData.name,
    description: formData.description,
    panels: existingPanels || [],
    style_preset: formData.style_preset,
    aspect_ratio: formData.aspect_ratio,
    source_script_id: sourceScriptId || null,
  };
}
