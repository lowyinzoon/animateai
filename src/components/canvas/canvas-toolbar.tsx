"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  Pencil,
  Undo2,
  Redo2,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  ImagePlus,
  Settings,
  Download,
  Save,
  FolderOpen,
} from "lucide-react";
import type { CanvasTool } from "@/types";

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddLine: () => void;
  onAddText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushWidth: number;
  onBrushWidthChange: (width: number) => void;
  onImportAsset: () => void;
  onSettings: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSelectedObject: boolean;
}

const tools: { tool: CanvasTool; icon: React.ElementType; label: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Select (V)" },
  { tool: "text", icon: Type, label: "Text (T)" },
  { tool: "rect", icon: Square, label: "Rectangle (R)" },
  { tool: "circle", icon: Circle, label: "Circle (C)" },
  { tool: "line", icon: Minus, label: "Line (L)" },
  { tool: "brush", icon: Pencil, label: "Brush (B)" },
];

export function CanvasToolbar({
  activeTool,
  onToolChange,
  onAddRect,
  onAddCircle,
  onAddLine,
  onAddText,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  zoom,
  onZoomIn,
  onZoomOut,
  brushColor,
  onBrushColorChange,
  brushWidth,
  onBrushWidthChange,
  onImportAsset,
  onSettings,
  onExport,
  onSave,
  onLoad,
  hasSelectedObject,
}: CanvasToolbarProps) {
  const handleToolClick = (tool: CanvasTool) => {
    if (tool === "rect") {
      onAddRect();
    } else if (tool === "circle") {
      onAddCircle();
    } else if (tool === "line") {
      onAddLine();
    } else if (tool === "text") {
      onAddText();
    } else {
      onToolChange(tool);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-background shrink-0 flex-wrap">
        {/* Tool buttons */}
        {tools.map(({ tool, icon: Icon, label }) => (
          <Tooltip key={tool}>
            <TooltipTrigger
              render={
                <Button
                  variant={activeTool === tool ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToolClick(tool)}
                />
              }
            >
              <Icon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Undo / Redo */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              />
            }
          >
            <Undo2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              />
            }
          >
            <Redo2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Layer ordering */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onBringToFront}
                disabled={!hasSelectedObject}
              />
            }
          >
            <ArrowUpToLine className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Bring to Front</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onBringForward}
                disabled={!hasSelectedObject}
              />
            }
          >
            <ChevronUp className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Bring Forward</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSendBackward}
                disabled={!hasSelectedObject}
              />
            }
          >
            <ChevronDown className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Send Backward</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSendToBack}
                disabled={!hasSelectedObject}
              />
            }
          >
            <ArrowDownToLine className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Send to Back</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Zoom */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onZoomOut}
              />
            }
          >
            <ZoomOut className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onZoomIn}
              />
            }
          >
            <ZoomIn className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        {/* Brush settings - shown when brush tool is active */}
        {activeTool === "brush" && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => onBrushColorChange(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border"
              />
              <Input
                type="number"
                min={1}
                max={50}
                value={brushWidth}
                onChange={(e) => onBrushWidthChange(Number(e.target.value))}
                className="h-7 w-16 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onImportAsset}
              />
            }
          >
            <ImagePlus className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Import Asset</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSettings}
              />
            }
          >
            <Settings className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Canvas Settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onLoad}
              />
            }
          >
            <FolderOpen className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Load Composition</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSave}
              />
            }
          >
            <Save className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Save Composition</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="default"
                size="sm"
                className="h-8"
                onClick={onExport}
              />
            }
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </TooltipTrigger>
          <TooltipContent>Export as PNG</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
