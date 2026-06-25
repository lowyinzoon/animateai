"use client";

import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Circle,
  Type,
  Minus,
  ImageIcon,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type * as fabric from "fabric";

interface CanvasLayersPanelProps {
  objects: fabric.FabricObject[];
  selectedObject: fabric.FabricObject | null;
  onSelectObject: (obj: fabric.FabricObject) => void;
  onToggleVisibility: (obj: fabric.FabricObject) => void;
  onToggleLock: (obj: fabric.FabricObject) => void;
}

function getObjectIcon(type: string) {
  switch (type) {
    case "rect":
      return Square;
    case "circle":
      return Circle;
    case "i-text":
    case "text":
    case "textbox":
      return Type;
    case "line":
      return Minus;
    case "image":
      return ImageIcon;
    case "path":
      return Pencil;
    default:
      return Square;
  }
}

function getObjectName(obj: fabric.FabricObject, index: number) {
  const type = obj.type || "object";
  const nameMap: Record<string, string> = {
    rect: "Rectangle",
    circle: "Circle",
    "i-text": "Text",
    text: "Text",
    textbox: "Text",
    line: "Line",
    image: "Image",
    path: "Path",
  };
  return `${nameMap[type] || type} ${index + 1}`;
}

export function CanvasLayersPanel({
  objects,
  selectedObject,
  onSelectObject,
  onToggleVisibility,
  onToggleLock,
}: CanvasLayersPanelProps) {
  // Display in reverse z-order (top layer first)
  const reversed = [...objects].reverse();

  if (objects.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No objects on canvas. Use the toolbar to add shapes, text, or import images.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {reversed.map((obj, i) => {
        const realIndex = objects.length - 1 - i;
        const Icon = getObjectIcon(obj.type || "");
        const isSelected = obj === selectedObject;
        const isVisible = obj.visible !== false;
        const isLocked = obj.lockMovementX === true;

        return (
          <div
            key={realIndex}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs cursor-pointer transition-colors",
              isSelected
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-foreground"
            )}
            onClick={() => onSelectObject(obj)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(obj);
              }}
            >
              {isVisible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(obj);
              }}
            >
              {isLocked ? (
                <Lock className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </Button>
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate flex-1">{getObjectName(obj, realIndex)}</span>
          </div>
        );
      })}
    </div>
  );
}
