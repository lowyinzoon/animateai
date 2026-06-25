"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import * as fabric from "fabric";
import type { CanvasTool } from "@/types";

interface UseCanvasOptions {
  width: number;
  height: number;
  backgroundColor: string;
}

export function useCanvas(options: UseCanvasOptions) {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [objects, setObjects] = useState<fabric.FabricObject[]>([]);
  const [zoom, setZoom] = useState(1);

  const syncObjects = useCallback(() => {
    if (!canvasRef.current) return;
    const objs = canvasRef.current.getObjects();
    setObjects([...objs]);
  }, []);

  const initCanvas = useCallback(
    (el: HTMLCanvasElement) => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
      }
      canvasElRef.current = el;

      const canvas = new fabric.Canvas(el, {
        width: options.width,
        height: options.height,
        backgroundColor: options.backgroundColor,
        preserveObjectStacking: true,
        selection: true,
      });

      canvas.on("selection:created", (e) => {
        setSelectedObject(e.selected?.[0] ?? null);
      });
      canvas.on("selection:updated", (e) => {
        setSelectedObject(e.selected?.[0] ?? null);
      });
      canvas.on("selection:cleared", () => {
        setSelectedObject(null);
      });
      canvas.on("object:added", syncObjects);
      canvas.on("object:removed", syncObjects);
      canvas.on("object:modified", syncObjects);

      canvasRef.current = canvas;
      syncObjects();

      return canvas;
    },
    [options.width, options.height, options.backgroundColor, syncObjects]
  );

  // Update canvas dimensions
  const setCanvasSize = useCallback(
    (width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    },
    []
  );

  // Update background color
  const setCanvasBackground = useCallback((color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.renderAll();
  }, []);

  // Tool switching
  const switchTool = useCallback(
    (tool: CanvasTool) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setActiveTool(tool);

      // Disable drawing mode by default
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "default";

      if (tool === "brush") {
        canvas.isDrawingMode = true;
        if (!canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        }
        canvas.freeDrawingBrush.color = "#000000";
        canvas.freeDrawingBrush.width = 3;
      } else if (tool === "select") {
        canvas.selection = true;
      } else {
        // For shape/text tools, we'll handle click-to-add
        canvas.selection = false;
        canvas.defaultCursor = "crosshair";
      }

      canvas.discardActiveObject();
      canvas.renderAll();
    },
    []
  );

  // Add shapes
  const addRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: canvas.width! / 2 - 75,
      top: canvas.height! / 2 - 50,
      width: 150,
      height: 100,
      fill: "#4f46e5",
      stroke: "#312e81",
      strokeWidth: 2,
      rx: 4,
      ry: 4,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    switchTool("select");
  }, [switchTool]);

  const addCircle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: canvas.width! / 2 - 50,
      top: canvas.height! / 2 - 50,
      radius: 50,
      fill: "#0ea5e9",
      stroke: "#0369a1",
      strokeWidth: 2,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    switchTool("select");
  }, [switchTool]);

  const addLine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const line = new fabric.Line(
      [
        canvas.width! / 2 - 75,
        canvas.height! / 2,
        canvas.width! / 2 + 75,
        canvas.height! / 2,
      ],
      {
        stroke: "#000000",
        strokeWidth: 3,
      }
    );
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
    switchTool("select");
  }, [switchTool]);

  const addText = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText("Double-click to edit", {
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2 - 15,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    switchTool("select");
  }, [switchTool]);

  // Import image from URL
  const addImageFromUrl = useCallback(
    async (url: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const img = await fabric.FabricImage.fromURL(url, {
          crossOrigin: "anonymous",
        });

        // Scale to fit ~40% of canvas
        const maxW = canvas.width! * 0.4;
        const maxH = canvas.height! * 0.4;
        const scale = Math.min(maxW / img.width!, maxH / img.height!, 1);
        img.scale(scale);

        // Center on canvas
        img.set({
          left: canvas.width! / 2 - (img.width! * scale) / 2,
          top: canvas.height! / 2 - (img.height! * scale) / 2,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        switchTool("select");
      } catch (err) {
        console.error("Failed to load image:", err);
        throw err;
      }
    },
    [switchTool]
  );

  // Delete selected object
  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, []);

  // Z-ordering
  const bringForward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringObjectForward(active);
      canvas.renderAll();
      syncObjects();
    }
  }, [syncObjects]);

  const sendBackward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.sendObjectBackwards(active);
      canvas.renderAll();
      syncObjects();
    }
  }, [syncObjects]);

  const bringToFront = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringObjectToFront(active);
      canvas.renderAll();
      syncObjects();
    }
  }, [syncObjects]);

  const sendToBack = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.sendObjectToBack(active);
      canvas.renderAll();
      syncObjects();
    }
  }, [syncObjects]);

  // Zoom
  const setCanvasZoom = useCallback((newZoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const clamped = Math.max(0.1, Math.min(5, newZoom));
    canvas.setZoom(clamped);
    canvas.renderAll();
    setZoom(clamped);
  }, []);

  // Serialize / Deserialize
  const toJSON = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toJSON();
  }, []);

  const loadFromJSON = useCallback(
    async (json: object) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await canvas.loadFromJSON(json);
      canvas.renderAll();
      syncObjects();
    },
    [syncObjects]
  );

  // Export as PNG
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Reset zoom for export
    const currentZoom = canvas.getZoom();
    canvas.setZoom(1);
    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 1,
    });
    canvas.setZoom(currentZoom);

    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Get thumbnail data URL
  const getThumbnailDataUrl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const currentZoom = canvas.getZoom();
    canvas.setZoom(1);
    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 0.25,
    });
    canvas.setZoom(currentZoom);
    return dataUrl;
  }, []);

  // Select object by reference
  const selectObject = useCallback((obj: fabric.FabricObject) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
  }, []);

  // Toggle object visibility
  const toggleObjectVisibility = useCallback(
    (obj: fabric.FabricObject) => {
      obj.visible = !obj.visible;
      canvasRef.current?.renderAll();
      syncObjects();
    },
    [syncObjects]
  );

  // Toggle object lock
  const toggleObjectLock = useCallback(
    (obj: fabric.FabricObject) => {
      const locked = !obj.lockMovementX;
      obj.lockMovementX = locked;
      obj.lockMovementY = locked;
      obj.lockRotation = locked;
      obj.lockScalingX = locked;
      obj.lockScalingY = locked;
      obj.selectable = !locked;
      obj.evented = !locked;
      canvasRef.current?.renderAll();
      syncObjects();
    },
    [syncObjects]
  );

  // Update object property
  const updateObjectProperty = useCallback(
    (prop: string, value: unknown) => {
      const canvas = canvasRef.current;
      if (!canvas || !selectedObject) return;
      selectedObject.set(prop as keyof fabric.FabricObject, value);
      canvas.renderAll();
      syncObjects();
    },
    [selectedObject, syncObjects]
  );

  // Set brush properties
  const setBrushColor = useCallback((color: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.color = color;
  }, []);

  const setBrushWidth = useCallback((width: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.width = width;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, []);

  return {
    canvasRef,
    canvasElRef,
    initCanvas,
    activeTool,
    switchTool,
    selectedObject,
    objects,
    zoom,
    setCanvasZoom,
    setCanvasSize,
    setCanvasBackground,
    addRect,
    addCircle,
    addLine,
    addText,
    addImageFromUrl,
    deleteSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    toJSON,
    loadFromJSON,
    exportPNG,
    getThumbnailDataUrl,
    selectObject,
    toggleObjectVisibility,
    toggleObjectLock,
    updateObjectProperty,
    setBrushColor,
    setBrushWidth,
    syncObjects,
  };
}
