"use client";

import { useEffect, useRef } from "react";

interface CanvasWorkspaceProps {
  initCanvas: (el: HTMLCanvasElement) => void;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function CanvasWorkspace({
  initCanvas,
  zoom,
  canvasWidth,
  canvasHeight,
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (canvasElRef.current && !initializedRef.current) {
      initializedRef.current = true;
      initCanvas(canvasElRef.current);
    }
  }, [initCanvas]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative"
      style={{
        backgroundImage:
          "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
      }}
    >
      <div className="flex items-center justify-center min-h-full p-8">
        <div
          className="shadow-2xl"
          style={{
            width: canvasWidth * zoom,
            height: canvasHeight * zoom,
          }}
        >
          <canvas ref={canvasElRef} />
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground border">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
