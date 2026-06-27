"use client";

import { cn } from "@/lib/utils";
import { SCRIPT_GENRES } from "@/types";

interface GenreSelectorProps {
  selected: string;
  onSelect: (genre: string) => void;
}

export function GenreSelector({ selected, onSelect }: GenreSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Genre</label>
      <div className="flex flex-wrap gap-2">
        {SCRIPT_GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => onSelect(genre)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm border transition-colors",
              selected === genre
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
