"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Film } from "lucide-react";
import type { Asset, StoryboardMetadata } from "@/types";

interface StoryboardListProps {
  storyboards: Asset[];
  selectedId: string | null;
  onSelect: (storyboard: Asset) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function StoryboardList({
  storyboards,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: StoryboardListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Storyboards</h3>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-2 pr-2">
          {storyboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No storyboards yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first storyboard to get started
              </p>
            </div>
          ) : (
            storyboards.map((storyboard) => {
              const meta = storyboard.metadata as unknown as StoryboardMetadata;
              const isSelected = selectedId === storyboard.id;
              const panelCount = meta?.panels?.length || 0;
              const imagesCount = meta?.panels?.filter((p) => p.image_url).length || 0;

              return (
                <Card
                  key={storyboard.id}
                  className={`group p-3 cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => onSelect(storyboard)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Film className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {storyboard.name || "Unnamed"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {panelCount} panel{panelCount !== 1 ? "s" : ""}
                        </Badge>
                        {imagesCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {imagesCount} image{imagesCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200"
                      aria-label={`Delete ${storyboard.name || "storyboard"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${storyboard.name || "Unnamed"}"? This cannot be undone.`)) {
                          onDelete(storyboard.id);
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
