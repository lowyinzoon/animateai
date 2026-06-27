"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CharacterList } from "@/components/character/character-list";
import {
  CharacterProfileForm,
  characterFormDataToMetadata,
} from "@/components/character/character-profile-form";
import { CharacterDetail } from "@/components/character/character-detail";
import { Users } from "lucide-react";
import type { Asset, CharacterMetadata } from "@/types";

type View = "list" | "create" | "edit";

export default function CharacterPage() {
  const [characters, setCharacters] = useState<Asset[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Asset | null>(null);
  const [view, setView] = useState<View>("list");
  const supabase = createClient();

  const loadCharacters = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "character")
      .order("created_at", { ascending: false });

    if (data) {
      setCharacters(data);
      // Refresh selected character if it exists
      if (selectedCharacter) {
        const updated = data.find((c) => c.id === selectedCharacter.id);
        if (updated) {
          setSelectedCharacter(updated);
        } else {
          setSelectedCharacter(null);
        }
      }
    }
  }, [supabase, selectedCharacter]);

  useEffect(() => {
    loadCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (formData: {
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
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const metadata = characterFormDataToMetadata(formData);

    const { data, error } = await supabase
      .from("assets")
      .insert({
        user_id: user.id,
        type: "character" as const,
        name: formData.name,
        prompt: formData.appearance_prompt,
        file_url: formData.referenceImageUrl,
        metadata: metadata as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create character");
      return;
    }

    toast.success("Character created!");
    setView("list");
    setSelectedCharacter(data);
    await loadCharacters();
  };

  const handleUpdate = async (formData: {
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
  }) => {
    if (!selectedCharacter) return;

    const existingMeta = selectedCharacter.metadata as unknown as CharacterMetadata;
    const metadata = characterFormDataToMetadata(
      formData,
      existingMeta?.generatedImages
    );

    const { error } = await supabase
      .from("assets")
      .update({
        name: formData.name,
        prompt: formData.appearance_prompt,
        file_url: formData.referenceImageUrl,
        metadata: metadata as unknown as Record<string, unknown>,
      })
      .eq("id", selectedCharacter.id);

    if (error) {
      toast.error("Failed to update character");
      return;
    }

    toast.success("Character updated!");
    setView("list");
    await loadCharacters();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete character");
      return;
    }

    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }

    toast.success("Character deleted");
    await loadCharacters();
  };

  const getEditFormData = () => {
    if (!selectedCharacter) return undefined;
    const meta = selectedCharacter.metadata as unknown as CharacterMetadata;
    return {
      name: selectedCharacter.name || "",
      description: meta?.description || "",
      traits: meta?.traits || [],
      backstory: meta?.backstory || "",
      age: meta?.age || "",
      gender: meta?.gender || "",
      species: meta?.species || "Human",
      appearance_prompt: meta?.appearance_prompt || "",
      style_preset: meta?.style_preset || "anime",
      referenceImageUrl: meta?.referenceImageUrl || null,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Character Design</h1>
        <p className="text-muted-foreground mt-1">
          Create consistent characters for your animations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Column */}
        <div className="space-y-4">
          {view === "list" && (
            <CharacterList
              characters={characters}
              selectedId={selectedCharacter?.id || null}
              onSelect={(character) => {
                setSelectedCharacter(character);
                setView("list");
              }}
              onCreate={() => {
                setView("create");
                setSelectedCharacter(null);
              }}
              onDelete={handleDelete}
            />
          )}
          {view === "create" && (
            <CharacterProfileForm
              onSubmit={handleCreate}
              onCancel={() => setView("list")}
            />
          )}
          {view === "edit" && selectedCharacter && (
            <CharacterProfileForm
              initialData={getEditFormData()}
              onSubmit={handleUpdate}
              onCancel={() => setView("list")}
              isEditing
            />
          )}
        </div>

        {/* Right Column */}
        <div>
          {selectedCharacter ? (
            <CharacterDetail
              character={selectedCharacter}
              onEdit={() => setView("edit")}
              onUpdate={loadCharacters}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">
                {characters.length === 0
                  ? "Create your first character"
                  : "Select a character"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {characters.length === 0
                  ? "Design characters with consistent appearances for your animation projects"
                  : "Choose a character from the list to view details and generate images"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
