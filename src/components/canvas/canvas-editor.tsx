"use client";

import { useState, useCallback, useEffect } from "react";
import { useCanvas } from "@/hooks/use-canvas";
import { useCanvasHistory } from "@/hooks/use-canvas-history";
import { CanvasToolbar } from "./canvas-toolbar";
import { CanvasWorkspace } from "./canvas-workspace";
import { CanvasPropertiesPanel } from "./canvas-properties-panel";
import { CanvasLayersPanel } from "./canvas-layers-panel";
import { CanvasAssetBrowser } from "./canvas-asset-browser";
import { CanvasSettingsDialog } from "./canvas-settings-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Asset } from "@/types";

export function CanvasEditor() {
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(3);
  const [assetBrowserOpen, setAssetBrowserOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [savedCompositions, setSavedCompositions] = useState<Asset[]>([]);
  const [loadingCompositions, setLoadingCompositions] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentCompositionId, setCurrentCompositionId] = useState<string | null>(null);

  const canvas = useCanvas({
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor,
  });

  const history = useCanvasHistory(canvas.canvasRef, canvas.syncObjects);

  // Attach history events after canvas init
  const handleInitCanvas = useCallback(
    (el: HTMLCanvasElement) => {
      canvas.initCanvas(el);
      // Small delay to let canvas setup finish
      setTimeout(() => {
        history.attachEvents();
      }, 100);
    },
    [canvas, history]
  );

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "v":
          canvas.switchTool("select");
          break;
        case "t":
          canvas.addText();
          break;
        case "r":
          canvas.addRect();
          break;
        case "c":
          canvas.addCircle();
          break;
        case "l":
          canvas.addLine();
          break;
        case "b":
          canvas.switchTool("brush");
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canvas]);

  // Settings apply
  const handleSettingsApply = useCallback(
    (w: number, h: number, bg: string) => {
      setCanvasWidth(w);
      setCanvasHeight(h);
      setBackgroundColor(bg);
      canvas.setCanvasSize(w, h);
      canvas.setCanvasBackground(bg);
    },
    [canvas]
  );

  // Import image
  const handleImportImage = useCallback(
    async (url: string) => {
      try {
        await canvas.addImageFromUrl(url);
        toast.success("Image added to canvas");
      } catch {
        toast.error("Failed to load image");
      }
    },
    [canvas]
  );

  // Save composition
  const handleSave = useCallback(async () => {
    const json = canvas.toJSON();
    if (!json) {
      toast.error("No canvas data to save");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in to save");
      setSaving(false);
      return;
    }

    try {
      // Generate thumbnail
      const thumbnailDataUrl = canvas.getThumbnailDataUrl();
      let fileUrl: string | null = null;

      if (thumbnailDataUrl) {
        const blob = await (await fetch(thumbnailDataUrl)).blob();
        const fileName = `canvas-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("generated-images")
          .upload(`${user.id}/${fileName}`, blob, {
            contentType: "image/png",
          });

        if (!uploadError && uploadData) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("generated-images")
            .getPublicUrl(uploadData.path);
          fileUrl = publicUrl;
        }
      }

      const metadata = {
        fabricJson: json,
        canvasWidth,
        canvasHeight,
        backgroundColor,
      };

      if (currentCompositionId) {
        // Update existing
        const { error } = await supabase
          .from("assets")
          .update({
            name: saveName || "Untitled Canvas",
            file_url: fileUrl,
            metadata,
          })
          .eq("id", currentCompositionId);

        if (error) throw error;
        toast.success("Composition updated");
      } else {
        // Create new
        const { data, error } = await supabase
          .from("assets")
          .insert({
            user_id: user.id,
            type: "canvas",
            name: saveName || "Untitled Canvas",
            file_url: fileUrl,
            metadata,
          })
          .select("id")
          .single();

        if (error) throw error;
        setCurrentCompositionId(data.id);
        toast.success("Composition saved");
      }

      setSaveDialogOpen(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save composition");
    } finally {
      setSaving(false);
    }
  }, [canvas, canvasWidth, canvasHeight, backgroundColor, saveName, currentCompositionId]);

  // Load dialog
  const handleOpenLoadDialog = useCallback(async () => {
    setLoadDialogOpen(true);
    setLoadingCompositions(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingCompositions(false);
      return;
    }

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "canvas")
      .order("created_at", { ascending: false });

    if (data) {
      setSavedCompositions(data);
    }
    setLoadingCompositions(false);
  }, []);

  // Load composition
  const handleLoadComposition = useCallback(
    async (asset: Asset) => {
      const meta = asset.metadata as {
        fabricJson?: object;
        canvasWidth?: number;
        canvasHeight?: number;
        backgroundColor?: string;
      };

      if (!meta?.fabricJson) {
        toast.error("Invalid composition data");
        return;
      }

      if (meta.canvasWidth && meta.canvasHeight) {
        setCanvasWidth(meta.canvasWidth);
        setCanvasHeight(meta.canvasHeight);
        canvas.setCanvasSize(meta.canvasWidth, meta.canvasHeight);
      }

      if (meta.backgroundColor) {
        setBackgroundColor(meta.backgroundColor);
        canvas.setCanvasBackground(meta.backgroundColor);
      }

      await canvas.loadFromJSON(meta.fabricJson);
      setCurrentCompositionId(asset.id);
      setSaveName(asset.name || "");
      setLoadDialogOpen(false);
      toast.success("Composition loaded");
    },
    [canvas]
  );

  // Zoom
  const handleZoomIn = useCallback(() => {
    canvas.setCanvasZoom(canvas.zoom + 0.1);
  }, [canvas]);

  const handleZoomOut = useCallback(() => {
    canvas.setCanvasZoom(canvas.zoom - 0.1);
  }, [canvas]);

  // Brush handlers
  const handleBrushColorChange = useCallback(
    (color: string) => {
      setBrushColor(color);
      canvas.setBrushColor(color);
    },
    [canvas]
  );

  const handleBrushWidthChange = useCallback(
    (width: number) => {
      setBrushWidth(width);
      canvas.setBrushWidth(width);
    },
    [canvas]
  );

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <CanvasToolbar
        activeTool={canvas.activeTool}
        onToolChange={canvas.switchTool}
        onAddRect={canvas.addRect}
        onAddCircle={canvas.addCircle}
        onAddLine={canvas.addLine}
        onAddText={canvas.addText}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onBringForward={canvas.bringForward}
        onSendBackward={canvas.sendBackward}
        onBringToFront={canvas.bringToFront}
        onSendToBack={canvas.sendToBack}
        zoom={canvas.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        brushColor={brushColor}
        onBrushColorChange={handleBrushColorChange}
        brushWidth={brushWidth}
        onBrushWidthChange={handleBrushWidthChange}
        onImportAsset={() => setAssetBrowserOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onExport={canvas.exportPNG}
        onSave={() => setSaveDialogOpen(true)}
        onLoad={handleOpenLoadDialog}
        hasSelectedObject={!!canvas.selectedObject}
      />

      {/* Main area: workspace + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas workspace */}
        <CanvasWorkspace
          initCanvas={handleInitCanvas}
          zoom={canvas.zoom}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />

        {/* Right panel */}
        <div className="w-64 border-l bg-background shrink-0 flex flex-col">
          <Tabs defaultValue={0}>
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value={0} className="flex-1 text-xs">
                Properties
              </TabsTrigger>
              <TabsTrigger value={1} className="flex-1 text-xs">
                Layers
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
              <TabsContent value={0} className="p-3 mt-0">
                <CanvasPropertiesPanel
                  selectedObject={canvas.selectedObject}
                  onUpdateProperty={canvas.updateObjectProperty}
                  backgroundColor={backgroundColor}
                  onBackgroundColorChange={(color) => {
                    setBackgroundColor(color);
                    canvas.setCanvasBackground(color);
                  }}
                />
              </TabsContent>

              <TabsContent value={1} className="p-3 mt-0">
                <CanvasLayersPanel
                  objects={canvas.objects}
                  selectedObject={canvas.selectedObject}
                  onSelectObject={canvas.selectObject}
                  onToggleVisibility={canvas.toggleObjectVisibility}
                  onToggleLock={canvas.toggleObjectLock}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <CanvasAssetBrowser
        open={assetBrowserOpen}
        onOpenChange={setAssetBrowserOpen}
        onSelectImage={handleImportImage}
      />

      <CanvasSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        width={canvasWidth}
        height={canvasHeight}
        backgroundColor={backgroundColor}
        onApply={handleSettingsApply}
      />

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Composition</DialogTitle>
            <DialogDescription>
              Give your canvas composition a name.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="My Composition"
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {currentCompositionId ? "Update" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Load Composition</DialogTitle>
            <DialogDescription>
              Select a saved composition to load.
            </DialogDescription>
          </DialogHeader>
          {loadingCompositions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedCompositions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No saved compositions found.
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {savedCompositions.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleLoadComposition(comp)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    {comp.file_url && (
                      <img
                        src={comp.file_url}
                        alt={comp.name || ""}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {comp.name || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
