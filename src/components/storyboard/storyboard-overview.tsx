"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SHOT_TYPES } from "@/types";
import type { Asset, StoryboardMetadata } from "@/types";
import { Printer, ImageIcon } from "lucide-react";

interface StoryboardOverviewProps {
  storyboard: Asset;
}

export function StoryboardOverview({ storyboard }: StoryboardOverviewProps) {
  const meta = storyboard.metadata as unknown as StoryboardMetadata;
  const panels = meta?.panels || [];

  const handlePrint = () => {
    window.print();
  };

  if (panels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No panels to display.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h3 className="text-sm font-medium">Overview</h3>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" />
          Export / Print
        </Button>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">{storyboard.name || "Storyboard"}</h1>
        {meta?.description && (
          <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3">
        {panels.map((panel, idx) => (
          <div
            key={panel.id}
            className="border border-border rounded-lg overflow-hidden print:break-inside-avoid"
          >
            <div className="aspect-video bg-muted relative">
              {panel.image_url ? (
                <Image
                  src={panel.image_url}
                  alt={`Panel ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-2 space-y-1">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px]">
                  #{idx + 1}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {SHOT_TYPES.find((s) => s.value === panel.shot_type)?.label || panel.shot_type}
                </Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {panel.duration_seconds}s
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {panel.scene_description}
              </p>
              {panel.dialogue && (
                <p className="text-[11px] italic text-muted-foreground line-clamp-1">
                  &ldquo;{panel.dialogue}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
