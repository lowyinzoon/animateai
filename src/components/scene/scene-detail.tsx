"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SceneImageGenerator } from "./scene-image-generator";
import { SceneGallery } from "./scene-gallery";
import { Pencil } from "lucide-react";
import type { Asset, SceneMetadata } from "@/types";

interface SceneDetailProps {
  scene: Asset;
  onEdit: () => void;
  onUpdate: () => void;
}

export function SceneDetail({ scene, onEdit, onUpdate }: SceneDetailProps) {
  const meta = scene.metadata as unknown as SceneMetadata;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{scene.name || "Unnamed"}</h2>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="gallery">
            Gallery
            {meta?.generated_images?.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {meta.generated_images.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab meta={meta} />
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          <SceneGallery scene={scene} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="generate" className="mt-4">
          <SceneImageGenerator scene={scene} onImageGenerated={onUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsTab({ meta }: { meta: SceneMetadata }) {
  if (!meta) {
    return (
      <p className="text-sm text-muted-foreground">
        No scene data available.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {meta.description && (
        <div>
          <h4 className="text-sm font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {meta.description}
          </p>
        </div>
      )}

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-3">Scene Properties</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {meta.environment && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Environment</p>
              <Badge variant="secondary">{meta.environment}</Badge>
            </div>
          )}
          {meta.time_of_day && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time of Day</p>
              <Badge variant="secondary">{meta.time_of_day}</Badge>
            </div>
          )}
          {meta.weather && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Weather</p>
              <Badge variant="secondary">{meta.weather}</Badge>
            </div>
          )}
          {meta.mood && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mood</p>
              <Badge variant="secondary">{meta.mood}</Badge>
            </div>
          )}
          {meta.lighting && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lighting</p>
              <Badge variant="secondary">{meta.lighting}</Badge>
            </div>
          )}
          {meta.color_palette && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Color Palette</p>
              <Badge variant="secondary">{meta.color_palette}</Badge>
            </div>
          )}
          {meta.style_preset && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Style</p>
              <Badge variant="outline">
                {meta.style_preset.replace(/-/g, " ")}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {meta.additional_details && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-2">Additional Details</h4>
            <p className="text-sm text-muted-foreground">
              {meta.additional_details}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
