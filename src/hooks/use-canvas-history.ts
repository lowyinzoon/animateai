"use client";

import { useRef, useCallback, useEffect } from "react";
import type * as fabric from "fabric";

const MAX_HISTORY = 50;

export function useCanvasHistory(
  canvasRef: React.RefObject<fabric.Canvas | null>,
  syncObjects: () => void
) {
  const historyRef = useRef<string[]>([]);
  const currentIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRestoringRef.current) return;

    const json = JSON.stringify(canvas.toJSON());

    // Discard any future states if we're not at the end
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    historyRef.current.push(json);

    // Trim to max
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(-MAX_HISTORY);
    }
    currentIndexRef.current = historyRef.current.length - 1;
  }, [canvasRef]);

  const undo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || currentIndexRef.current <= 0) return;

    isRestoringRef.current = true;
    currentIndexRef.current--;
    const state = historyRef.current[currentIndexRef.current];
    await canvas.loadFromJSON(JSON.parse(state));
    canvas.renderAll();
    syncObjects();
    isRestoringRef.current = false;
  }, [canvasRef, syncObjects]);

  const redo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || currentIndexRef.current >= historyRef.current.length - 1) return;

    isRestoringRef.current = true;
    currentIndexRef.current++;
    const state = historyRef.current[currentIndexRef.current];
    await canvas.loadFromJSON(JSON.parse(state));
    canvas.renderAll();
    syncObjects();
    isRestoringRef.current = false;
  }, [canvasRef, syncObjects]);

  const canUndo = currentIndexRef.current > 0;
  const canRedo = currentIndexRef.current < historyRef.current.length - 1;

  // Attach canvas events for auto-save
  const attachEvents = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = () => {
      if (!isRestoringRef.current) {
        saveState();
      }
    };

    canvas.on("object:added", handler);
    canvas.on("object:removed", handler);
    canvas.on("object:modified", handler);

    // Save initial state
    saveState();

    return () => {
      canvas.off("object:added", handler);
      canvas.off("object:removed", handler);
      canvas.off("object:modified", handler);
    };
  }, [canvasRef, saveState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        // Don't delete if we're editing text
        if (active && !(active as fabric.IText).isEditing) {
          e.preventDefault();
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, canvasRef]);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    attachEvents,
  };
}
