"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { StoryboardList } from "@/components/storyboard/storyboard-list";
import { StoryboardForm, storyboardFormDataToMetadata } from "@/components/storyboard/storyboard-form";
import type { StoryboardFormData } from "@/components/storyboard/storyboard-form";
import { StoryboardCanvas } from "@/components/storyboard/storyboard-canvas";
import { Film } from "lucide-react";
import type { Asset, StoryboardMetadata } from "@/types";

type View = "list" | "create" | "edit";

export default function StoryboardPage() {
  const [storyboards, setStoryboards] = useState<Asset[]>([]);
  const [selectedStoryboard, setSelectedStoryboard] = useState<Asset | null>(null);
  const [view, setView] = useState<View>("list");
  const supabase = createClient();

  const loadStoryboards = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "storyboard")
      .order("created_at", { ascending: false });

    if (data) {
      setStoryboards(data);
      if (selectedStoryboard) {
        const updated = data.find((s) => s.id === selectedStoryboard.id);
        if (updated) {
          setSelectedStoryboard(updated);
        } else {
          setSelectedStoryboard(null);
        }
      }
    }
  }, [supabase, selectedStoryboard]);

  useEffect(() => {
    loadStoryboards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (formData: StoryboardFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const metadata = storyboardFormDataToMetadata(formData);

    const { data, error } = await supabase
      .from("assets")
      .insert({
        user_id: user.id,
        type: "storyboard" as const,
        name: formData.name,
        prompt: formData.description,
        metadata: metadata as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create storyboard");
      return;
    }

    toast.success("Storyboard created!");
    setView("list");
    setSelectedStoryboard(data);
    await loadStoryboards();
  };

  const handleUpdate = async (formData: StoryboardFormData) => {
    if (!selectedStoryboard) return;

    const existingMeta = selectedStoryboard.metadata as unknown as StoryboardMetadata;
    const metadata = storyboardFormDataToMetadata(
      formData,
      existingMeta?.panels,
      existingMeta?.source_script_id
    );

    const { error } = await supabase
      .from("assets")
      .update({
        name: formData.name,
        prompt: formData.description,
        metadata: metadata as unknown as Record<string, unknown>,
      })
      .eq("id", selectedStoryboard.id);

    if (error) {
      toast.error("Failed to update storyboard");
      return;
    }

    toast.success("Storyboard updated!");
    setView("list");
    await loadStoryboards();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete storyboard");
      return;
    }

    if (selectedStoryboard?.id === id) {
      setSelectedStoryboard(null);
    }

    toast.success("Storyboard deleted");
    await loadStoryboards();
  };

  const getEditFormData = (): StoryboardFormData | undefined => {
    if (!selectedStoryboard) return undefined;
    const meta = selectedStoryboard.metadata as unknown as StoryboardMetadata;
    return {
      name: selectedStoryboard.name || "",
      description: meta?.description || "",
      style_preset: meta?.style_preset || "digital-art",
      aspect_ratio: meta?.aspect_ratio || "16:9",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Story Films</h1>
        <p className="text-muted-foreground mt-1">
          Create multi-panel storyboards from your scripts
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Column */}
        <div className="space-y-4">
          {view === "list" && (
            <StoryboardList
              storyboards={storyboards}
              selectedId={selectedStoryboard?.id || null}
              onSelect={(storyboard) => {
                setSelectedStoryboard(storyboard);
                setView("list");
              }}
              onCreate={() => {
                setView("create");
                setSelectedStoryboard(null);
              }}
              onDelete={handleDelete}
            />
          )}
          {view === "create" && (
            <StoryboardForm
              onSubmit={handleCreate}
              onCancel={() => setView("list")}
            />
          )}
          {view === "edit" && selectedStoryboard && (
            <StoryboardForm
              initialData={getEditFormData()}
              onSubmit={handleUpdate}
              onCancel={() => setView("list")}
              isEditing
            />
          )}
        </div>

        {/* Right Column */}
        <div>
          {selectedStoryboard ? (
            <StoryboardCanvas
              storyboard={selectedStoryboard}
              onEdit={() => setView("edit")}
              onUpdate={loadStoryboards}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Film className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">
                {storyboards.length === 0
                  ? "Create your first storyboard"
                  : "Select a storyboard"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {storyboards.length === 0
                  ? "Create multi-panel storyboards from your scripts or build them from scratch"
                  : "Choose a storyboard from the list to view and edit panels"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
