"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CANVAS_PRESETS } from "@/types";

interface CanvasSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width: number;
  height: number;
  backgroundColor: string;
  onApply: (width: number, height: number, backgroundColor: string) => void;
}

export function CanvasSettingsDialog({
  open,
  onOpenChange,
  width,
  height,
  backgroundColor,
  onApply,
}: CanvasSettingsDialogProps) {
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);
  const [localBg, setLocalBg] = useState(backgroundColor);

  // Sync when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalWidth(width);
      setLocalHeight(height);
      setLocalBg(backgroundColor);
    }
    onOpenChange(open);
  };

  const handleApply = () => {
    onApply(localWidth, localHeight, localBg);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Canvas Settings</DialogTitle>
          <DialogDescription>
            Set canvas dimensions and background color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Presets */}
          <div>
            <Label className="text-xs">Presets</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {CANVAS_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant={
                    localWidth === preset.width && localHeight === preset.height
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => {
                    setLocalWidth(preset.width);
                    setLocalHeight(preset.height);
                  }}
                >
                  {preset.width}x{preset.height}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                min={100}
                max={4096}
                value={localWidth}
                onChange={(e) => setLocalWidth(Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                min={100}
                max={4096}
                value={localHeight}
                onChange={(e) => setLocalHeight(Number(e.target.value))}
                className="h-8"
              />
            </div>
          </div>

          {/* Background color */}
          <div>
            <Label className="text-xs">Background Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={localBg}
                onChange={(e) => setLocalBg(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <Input
                value={localBg}
                onChange={(e) => setLocalBg(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
