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
import { ReferenceImageUpload } from "./reference-image-upload";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  IMAGE_STYLES,
  CHARACTER_GENDERS,
  CHARACTER_SPECIES_SUGGESTIONS,
} from "@/types";
import type { CharacterMetadata } from "@/types";
import { Save, X, Plus } from "lucide-react";

interface CharacterFormData {
  name: string;
  description: string;
  traits: string[];
  backstory: string;
  age: string;
  gender: string;
  species: string;
  appearance_prompt: string;
  style_preset: string;
  referenceImageUrl: string | null;
}

interface CharacterProfileFormProps {
  initialData?: CharacterFormData;
  onSubmit: (data: CharacterFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const defaultFormData: CharacterFormData = {
  name: "",
  description: "",
  traits: [],
  backstory: "",
  age: "",
  gender: "",
  species: "Human",
  appearance_prompt: "",
  style_preset: "anime",
  referenceImageUrl: null,
};

export function CharacterProfileForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: CharacterProfileFormProps) {
  const [formData, setFormData] = useState<CharacterFormData>(
    initialData || defaultFormData
  );
  const [traitInput, setTraitInput] = useState("");
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

  const addTrait = () => {
    const trait = traitInput.trim();
    if (trait && !formData.traits.includes(trait)) {
      setFormData((prev) => ({ ...prev, traits: [...prev.traits, trait] }));
      setTraitInput("");
    }
  };

  const removeTrait = (trait: string) => {
    setFormData((prev) => ({
      ...prev,
      traits: prev.traits.filter((t) => t !== trait),
    }));
  };

  const handleTraitKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTrait();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Edit Character" : "New Character"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ReferenceImageUpload
        imageUrl={formData.referenceImageUrl}
        onImageChange={(url) =>
          setFormData((prev) => ({ ...prev, referenceImageUrl: url }))
        }
      />

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Character name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the character..."
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            placeholder="e.g. 25"
            value={formData.age}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, age: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, gender: v ?? "" }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CHARACTER_GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Species</Label>
          <Select
            value={formData.species}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, species: v ?? "Human" }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CHARACTER_SPECIES_SUGGESTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Traits</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a trait..."
            value={traitInput}
            onChange={(e) => setTraitInput(e.target.value)}
            onKeyDown={handleTraitKeyDown}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addTrait}
            disabled={!traitInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {formData.traits.map((trait) => (
              <Badge
                key={trait}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => removeTrait(trait)}
              >
                {trait}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="backstory">Backstory</Label>
        <Textarea
          id="backstory"
          placeholder="Character's backstory and history..."
          value={formData.backstory}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, backstory: e.target.value }))
          }
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appearance">Appearance Description *</Label>
        <Textarea
          id="appearance"
          placeholder="Detailed visual description for AI consistency... e.g., 'Young woman with silver hair, blue eyes, pointed ears, dark cloak'"
          value={formData.appearance_prompt}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              appearance_prompt: e.target.value,
            }))
          }
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          This description is prepended to every generated image prompt for
          visual consistency.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Style Preset</Label>
        <Select
          value={formData.style_preset}
          onValueChange={(v) =>
            setFormData((prev) => ({ ...prev, style_preset: v ?? "anime" }))
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
            {isEditing ? "Update Character" : "Create Character"}
          </>
        )}
      </Button>
    </form>
  );
}

export function characterFormDataToMetadata(
  formData: {
    description: string;
    traits: string[];
    backstory: string;
    age: string;
    gender: string;
    species: string;
    appearance_prompt: string;
    style_preset: string;
    referenceImageUrl: string | null;
  },
  existingImages?: CharacterMetadata["generatedImages"]
): CharacterMetadata {
  return {
    description: formData.description,
    traits: formData.traits,
    backstory: formData.backstory,
    age: formData.age,
    gender: formData.gender,
    species: formData.species,
    referenceImageUrl: formData.referenceImageUrl,
    generatedImages: existingImages || [],
    style_preset: formData.style_preset,
    appearance_prompt: formData.appearance_prompt,
  };
}
