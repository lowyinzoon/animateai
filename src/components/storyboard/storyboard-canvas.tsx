"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryboardPanelEditor } from "./storyboard-panel-editor";
import { ScriptImportDialog } from "./script-import-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Plus, Import, Wand2, Printer, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Asset, StoryboardMetadata, StoryboardPanel } from "@/types";

interface StoryboardCanvasProps {
  storyboard: Asset;
  onEdit: () => void;
  onUpdate: () => void;
}

export function StoryboardCanvas({
  storyboard,
  onEdit,
  onUpdate,
}: StoryboardCanvasProps) {
  const meta = storyboard.metadata as unknown as StoryboardMetadata;
  const panels = meta?.panels || [];
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const supabase = createClient();

  const savePanels = async (updatedPanels: StoryboardPanel[]) => {
    const updatedMeta = {
      ...meta,
      panels: updatedPanels,
    };

    const { error } = await supabase
      .from("assets")
      .update({
        metadata: updatedMeta as unknown as Record<string, unknown>,
      })
      .eq("id", storyboard.id);

    if (error) {
      toast.error("Failed to save panels");
      return;
    }

    onUpdate();
  };

  const handlePanelUpdate = (index: number, updatedPanel: StoryboardPanel) => {
    const updatedPanels = [...panels];
    updatedPanels[index] = updatedPanel;
    savePanels(updatedPanels);
  };

  const handlePanelDelete = (index: number) => {
    if (!window.confirm("Delete this panel?")) return;
    const updatedPanels = panels.filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, order: i }));
    savePanels(updatedPanels);
  };

  const handleAddPanel = () => {
    const newPanel: StoryboardPanel = {
      id: crypto.randomUUID(),
      order: panels.length,
      scene_description: "",
      dialogue: "",
      action_notes: "",
      shot_type: "medium",
      duration_seconds: 3,
      image_url: null,
      image_prompt: "",
    };
    savePanels([...panels, newPanel]);
  };

  const handleImportPanels = (importedPanels: StoryboardPanel[], scriptId: string) => {
    const updatedMeta = {
      ...meta,
      panels: importedPanels.map((p, i) => ({ ...p, order: i })),
      source_script_id: scriptId,
    };

    supabase
      .from("assets")
      .update({
        metadata: updatedMeta as unknown as Record<string, unknown>,
      })
      .eq("id", storyboard.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Failed to import panels");
        } else {
          onUpdate();
        }
      });
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const updatedPanels = [...panels];
    const draggedPanel = updatedPanels[dragItem.current];
    updatedPanels.splice(dragItem.current, 1);
    updatedPanels.splice(dragOverItem.current, 0, draggedPanel);

    const reorderedPanels = updatedPanels.map((p, i) => ({ ...p, order: i }));

    dragItem.current = null;
    dragOverItem.current = null;

    savePanels(reorderedPanels);
  };

  const handleGenerateAll = async () => {
    const panelsWithoutImages = panels.filter((p) => !p.image_url && (p.image_prompt || p.scene_description));
    if (panelsWithoutImages.length === 0) {
      toast.info("All panels already have images");
      return;
    }

    setIsGeneratingAll(true);
    setGeneratingProgress(0);

    for (let i = 0; i < panelsWithoutImages.length; i++) {
      const panel = panelsWithoutImages[i];
      try {
        const response = await fetch("/api/generate-storyboard-panel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyboardId: storyboard.id,
            panelId: panel.id,
            prompt: panel.image_prompt || panel.scene_description,
            shot_type: panel.shot_type,
            style_preset: meta.style_preset,
            width: 1536,
            height: 1024,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Generation failed");
        }

        setGeneratingProgress(i + 1);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Generation failed";
        toast.error(`Panel ${panel.order + 1}: ${message}`);
        break;
      }
    }

    setIsGeneratingAll(false);
    setGeneratingProgress(0);
    onUpdate();
    toast.success("Batch generation complete!");
  };

  const handlePrint = () => {
    window.print();
  };

  const totalDuration = panels.reduce((sum, p) => sum + p.duration_seconds, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{storyboard.name || "Unnamed"}</h2>
          {meta?.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">
          {panels.length} panel{panels.length !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline">
          {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} total
        </Badge>
        {meta?.style_preset && (
          <Badge variant="outline">
            {meta.style_preset.replace(/-/g, " ")}
          </Badge>
        )}
        {meta?.aspect_ratio && (
          <Badge variant="outline">{meta.aspect_ratio}</Badge>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleAddPanel}>
          <Plus className="h-4 w-4 mr-1" />
          Add Panel
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowImportDialog(true)}>
          <Import className="h-4 w-4 mr-1" />
          Import from Script
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateAll}
          disabled={isGeneratingAll}
        >
          {isGeneratingAll ? (
            <>
              <LoadingSpinner className="mr-1 h-4 w-4" />
              Generating {generatingProgress}/{panels.filter((p) => !p.image_url).length}...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-1" />
              Generate All
            </>
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-22rem)]">
        <div className="space-y-3 pr-2">
          {panels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">No panels yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add panels manually or import from a script
              </p>
            </div>
          ) : (
            panels.map((panel, idx) => (
              <StoryboardPanelEditor
                key={panel.id}
                panel={panel}
                panelNumber={idx + 1}
                storyboardId={storyboard.id}
                stylePreset={meta.style_preset || "digital-art"}
                onUpdate={(updatedPanel) => handlePanelUpdate(idx, updatedPanel)}
                onDelete={() => handlePanelDelete(idx)}
                onImageGenerated={onUpdate}
                dragHandleProps={{
                  onDragStart: handleDragStart(idx),
                  onDragOver: handleDragOver(idx),
                  onDragEnd: handleDragEnd,
                  draggable: true,
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <ScriptImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportPanels}
      />
    </div>
  );
}
