"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Users } from "lucide-react";
import type { Asset } from "@/types";
import type { CharacterMetadata } from "@/types";

interface CharacterListProps {
  characters: Asset[];
  selectedId: string | null;
  onSelect: (character: Asset) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function CharacterList({
  characters,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: CharacterListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Characters</h3>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-2 pr-2">
          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No characters yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first character to get started
              </p>
            </div>
          ) : (
            characters.map((character) => {
              const meta = character.metadata as unknown as CharacterMetadata;
              const isSelected = selectedId === character.id;

              return (
                <Card
                  key={character.id}
                  className={`group p-3 cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => onSelect(character)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {character.file_url ? (
                        <Image
                          src={character.file_url}
                          alt={character.name || "Character"}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {character.name || "Unnamed"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {meta?.species && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {meta.species}
                          </Badge>
                        )}
                        {meta?.generatedImages?.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {meta.generatedImages.length} image
                            {meta.generatedImages.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200"
                      aria-label={`Delete ${character.name || "character"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${character.name || "Unnamed"}"? This cannot be undone.`)) {
                          onDelete(character.id);
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
