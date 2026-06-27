"use client";

import { useState } from "react";
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
import {
  IMAGE_STYLES,
  SCENE_ENVIRONMENTS,
  SCENE_TIMES_OF_DAY,
  SCENE_WEATHER_OPTIONS,
  SCENE_MOODS,
  SCENE_LIGHTING_STYLES,
  SCENE_COLOR_PALETTES,
  SCENE_PRESETS,
} from "@/types";
import type { SceneMetadata } from "@/types";
import { Save, X, Sparkles } from "lucide-react";

export interface SceneFormData {
  name: string;
  description: string;
  environment: string;
  time_of_day: string;
  weather: string;
  mood: string;
  lighting: string;
  color_palette: string;
  style_preset: string;
  additional_details: string;
}

interface SceneFormProps {
  initialData?: SceneFormData;
  onSubmit: (data: SceneFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const defaultFormData: SceneFormData = {
  name: "",
  description: "",
  environment: "exterior",
  time_of_day: "noon",
  weather: "clear",
  mood: "peaceful",
  lighting: "natural",
  color_palette: "warm",
  style_preset: "digital-art",
  additional_details: "",
};

export function SceneForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: SceneFormProps) {
  const [formData, setFormData] = useState<SceneFormData>(
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

  const applyPreset = (presetValue: string) => {
    const preset = SCENE_PRESETS.find((p) => p.value === presetValue);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        environment: preset.environment,
        time_of_day: preset.time_of_day,
        weather: preset.weather,
        mood: preset.mood,
        lighting: preset.lighting,
        color_palette: preset.palette,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Edit Scene" : "New Scene"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scene-name">Name *</Label>
        <Input
          id="scene-name"
          placeholder="Scene name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scene-desc">Description</Label>
        <Textarea
          id="scene-desc"
          placeholder="Describe the scene..."
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Quick Presets
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {SCENE_PRESETS.map((preset) => (
            <Badge
              key={preset.value}
              variant="secondary"
              className="cursor-pointer text-xs hover:bg-primary/20"
              onClick={() => applyPreset(preset.value)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Environment</Label>
          <Select
            value={formData.environment}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, environment: v ?? "exterior" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_ENVIRONMENTS.map((env) => (
                <SelectItem key={env.value} value={env.value}>
                  {env.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Time of Day</Label>
          <Select
            value={formData.time_of_day}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, time_of_day: v ?? "noon" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_TIMES_OF_DAY.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Weather</Label>
          <Select
            value={formData.weather}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, weather: v ?? "clear" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_WEATHER_OPTIONS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Mood</Label>
          <Select
            value={formData.mood}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, mood: v ?? "peaceful" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_MOODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Lighting</Label>
          <Select
            value={formData.lighting}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, lighting: v ?? "natural" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_LIGHTING_STYLES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Color Palette</Label>
          <Select
            value={formData.color_palette}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, color_palette: v ?? "warm" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_COLOR_PALETTES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Label htmlFor="scene-details">Additional Details</Label>
        <Textarea
          id="scene-details"
          placeholder="Any extra details for generation (props, textures, specific elements)..."
          value={formData.additional_details}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              additional_details: e.target.value,
            }))
          }
          rows={2}
          className="resize-none"
        />
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
            {isEditing ? "Update Scene" : "Create Scene"}
          </>
        )}
      </Button>
    </form>
  );
}

export function sceneFormDataToMetadata(
  formData: SceneFormData,
  existingImages?: SceneMetadata["generated_images"]
): SceneMetadata {
  return {
    description: formData.description,
    environment: formData.environment as SceneMetadata["environment"],
    time_of_day: formData.time_of_day as SceneMetadata["time_of_day"],
    weather: formData.weather as SceneMetadata["weather"],
    mood: formData.mood as SceneMetadata["mood"],
    lighting: formData.lighting as SceneMetadata["lighting"],
    color_palette: formData.color_palette,
    style_preset: formData.style_preset,
    additional_details: formData.additional_details,
    generated_images: existingImages || [],
  };
}
