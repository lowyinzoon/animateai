"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Palette } from "lucide-react";
import type { Asset, SceneMetadata } from "@/types";

interface SceneListProps {
  scenes: Asset[];
  selectedId: string | null;
  onSelect: (scene: Asset) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function SceneList({
  scenes,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: SceneListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scenes</h3>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-2 pr-2">
          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Palette className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No scenes yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first scene to get started
              </p>
            </div>
          ) : (
            scenes.map((scene) => {
              const meta = scene.metadata as unknown as SceneMetadata;
              const isSelected = selectedId === scene.id;
              const thumbnailUrl = meta?.generated_images?.[0]?.url;

              return (
                <Card
                  key={scene.id}
                  className={`group p-3 cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => onSelect(scene)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={scene.name || "Scene"}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Palette className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {scene.name || "Unnamed"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {meta?.environment && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {meta.environment}
                          </Badge>
                        )}
                        {meta?.generated_images?.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {meta.generated_images.length} image
                            {meta.generated_images.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200"
                      aria-label={`Delete ${scene.name || "scene"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${scene.name || "Unnamed"}"? This cannot be undone.`)) {
                          onDelete(scene.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors duration-200" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
