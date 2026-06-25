"use client";

import dynamic from "next/dynamic";

const CanvasEditor = dynamic(
  () =>
    import("@/components/canvas/canvas-editor").then((mod) => mod.CanvasEditor),
  { ssr: false }
);

export default function CanvasPage() {
  return <CanvasEditor />;
}
