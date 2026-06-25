"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type * as fabric from "fabric";

interface CanvasPropertiesPanelProps {
  selectedObject: fabric.FabricObject | null;
  onUpdateProperty: (prop: string, value: unknown) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
}

export function CanvasPropertiesPanel({
  selectedObject,
  onUpdateProperty,
  backgroundColor,
  onBackgroundColorChange,
}: CanvasPropertiesPanelProps) {
  // Local state to avoid jitter during typing
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // Reset local values when selection changes
  useEffect(() => {
    setLocalValues({});
  }, [selectedObject]);

  if (!selectedObject) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          No object selected. Select an object on the canvas to edit its properties.
        </p>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs">Canvas Background</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <Input
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "text" || selectedObject.type === "textbox";

  const getVal = (prop: string, fallback: string | number = "") => {
    if (prop in localValues) return localValues[prop];
    const v = (selectedObject as unknown as Record<string, unknown>)[prop];
    if (v === undefined || v === null) return String(fallback);
    return String(typeof v === "number" ? Math.round(v) : v);
  };

  const handleNumericChange = (prop: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [prop]: value }));
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdateProperty(prop, num);
    }
  };

  const handleColorChange = (prop: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [prop]: value }));
    onUpdateProperty(prop, value);
  };

  return (
    <div className="space-y-4">
      {/* Position */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Position
        </Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div>
            <Label className="text-xs">X</Label>
            <Input
              type="number"
              value={getVal("left", 0)}
              onChange={(e) => handleNumericChange("left", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Y</Label>
            <Input
              type="number"
              value={getVal("top", 0)}
              onChange={(e) => handleNumericChange("top", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Size
        </Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div>
            <Label className="text-xs">W</Label>
            <Input
              type="number"
              value={getVal("width", 0)}
              onChange={(e) => handleNumericChange("width", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">H</Label>
            <Input
              type="number"
              value={getVal("height", 0)}
              onChange={(e) => handleNumericChange("height", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Rotation & Opacity */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Transform
        </Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div>
            <Label className="text-xs">Rotation</Label>
            <Input
              type="number"
              value={getVal("angle", 0)}
              onChange={(e) => handleNumericChange("angle", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Opacity</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={getVal("opacity", 1)}
              onChange={(e) => handleNumericChange("opacity", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Fill & Stroke */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Appearance
        </Label>
        <div className="space-y-2 mt-1.5">
          <div>
            <Label className="text-xs">Fill</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={getVal("fill", "#000000") as string}
                onChange={(e) => handleColorChange("fill", e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border"
              />
              <Input
                value={getVal("fill", "#000000")}
                onChange={(e) => handleColorChange("fill", e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Stroke</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={getVal("stroke", "#000000") as string}
                onChange={(e) => handleColorChange("stroke", e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border"
              />
              <Input
                value={getVal("stroke", "")}
                onChange={(e) => handleColorChange("stroke", e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Stroke Width</Label>
            <Input
              type="number"
              min={0}
              value={getVal("strokeWidth", 0)}
              onChange={(e) => handleNumericChange("strokeWidth", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Text properties */}
      {isText && (
        <>
          <Separator />
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Text
            </Label>
            <div className="space-y-2 mt-1.5">
              <div>
                <Label className="text-xs">Font Family</Label>
                <Input
                  value={getVal("fontFamily", "Arial")}
                  onChange={(e) => {
                    setLocalValues((prev) => ({ ...prev, fontFamily: e.target.value }));
                    onUpdateProperty("fontFamily", e.target.value);
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Font Size</Label>
                <Input
                  type="number"
                  min={1}
                  value={getVal("fontSize", 24)}
                  onChange={(e) => handleNumericChange("fontSize", e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
