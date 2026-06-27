"use client";

import { cn } from "@/lib/utils";
import { IMAGE_STYLES } from "@/types";

interface StylePresetsProps {
  selected: string;
  onSelect: (style: string) => void;
}

export function StylePresets({ selected, onSelect }: StylePresetsProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Style Preset</label>
      <div className="flex flex-wrap gap-2">
        {IMAGE_STYLES.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => onSelect(style.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm border transition-colors",
              selected === style.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
  );
}
