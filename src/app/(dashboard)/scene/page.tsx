"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { SceneList } from "@/components/scene/scene-list";
import { SceneForm, sceneFormDataToMetadata } from "@/components/scene/scene-form";
import type { SceneFormData } from "@/components/scene/scene-form";
import { SceneDetail } from "@/components/scene/scene-detail";
import { Palette } from "lucide-react";
import type { Asset, SceneMetadata } from "@/types";

type View = "list" | "create" | "edit";

export default function ScenePage() {
  const [scenes, setScenes] = useState<Asset[]>([]);
  const [selectedScene, setSelectedScene] = useState<Asset | null>(null);
  const [view, setView] = useState<View>("list");
  const supabase = createClient();

  const loadScenes = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "scene")
      .order("created_at", { ascending: false });

    if (data) {
      setScenes(data);
      if (selectedScene) {
        const updated = data.find((s) => s.id === selectedScene.id);
        if (updated) {
          setSelectedScene(updated);
        } else {
          setSelectedScene(null);
        }
      }
    }
  }, [supabase, selectedScene]);

  useEffect(() => {
    loadScenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (formData: SceneFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const metadata = sceneFormDataToMetadata(formData);

    const { data, error } = await supabase
      .from("assets")
      .insert({
        user_id: user.id,
        type: "scene" as const,
        name: formData.name,
        prompt: formData.description,
        metadata: metadata as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create scene");
      return;
    }

    toast.success("Scene created!");
    setView("list");
    setSelectedScene(data);
    await loadScenes();
  };

  const handleUpdate = async (formData: SceneFormData) => {
    if (!selectedScene) return;

    const existingMeta = selectedScene.metadata as unknown as SceneMetadata;
    const metadata = sceneFormDataToMetadata(
      formData,
      existingMeta?.generated_images
    );

    const { error } = await supabase
      .from("assets")
      .update({
        name: formData.name,
        prompt: formData.description,
        metadata: metadata as unknown as Record<string, unknown>,
      })
      .eq("id", selectedScene.id);

    if (error) {
      toast.error("Failed to update scene");
      return;
    }

    toast.success("Scene updated!");
    setView("list");
    await loadScenes();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete scene");
      return;
    }

    if (selectedScene?.id === id) {
      setSelectedScene(null);
    }

    toast.success("Scene deleted");
    await loadScenes();
  };

  const getEditFormData = (): SceneFormData | undefined => {
    if (!selectedScene) return undefined;
    const meta = selectedScene.metadata as unknown as SceneMetadata;
    return {
      name: selectedScene.name || "",
      description: meta?.description || "",
      environment: meta?.environment || "exterior",
      time_of_day: meta?.time_of_day || "noon",
      weather: meta?.weather || "clear",
      mood: meta?.mood || "peaceful",
      lighting: meta?.lighting || "natural",
      color_palette: meta?.color_palette || "warm",
      style_preset: meta?.style_preset || "digital-art",
      additional_details: meta?.additional_details || "",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scene Design</h1>
        <p className="text-muted-foreground mt-1">
          Create detailed scene backgrounds and environments
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Column */}
        <div className="space-y-4">
          {view === "list" && (
            <SceneList
              scenes={scenes}
              selectedId={selectedScene?.id || null}
              onSelect={(scene) => {
                setSelectedScene(scene);
                setView("list");
              }}
              onCreate={() => {
                setView("create");
                setSelectedScene(null);
              }}
              onDelete={handleDelete}
            />
          )}
          {view === "create" && (
            <SceneForm
              onSubmit={handleCreate}
              onCancel={() => setView("list")}
            />
          )}
          {view === "edit" && selectedScene && (
            <SceneForm
              initialData={getEditFormData()}
              onSubmit={handleUpdate}
              onCancel={() => setView("list")}
              isEditing
            />
          )}
        </div>

        {/* Right Column */}
        <div>
          {selectedScene ? (
            <SceneDetail
              scene={selectedScene}
              onEdit={() => setView("edit")}
              onUpdate={loadScenes}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Palette className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">
                {scenes.length === 0
                  ? "Create your first scene"
                  : "Select a scene"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {scenes.length === 0
                  ? "Design scene backgrounds with environment, lighting, and mood settings"
                  : "Choose a scene from the list to view details and generate images"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
