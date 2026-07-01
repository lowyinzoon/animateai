"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { createContext, useContext } from "react";
import { Loader2, Film, X } from "lucide-react";

export type FrameData = {
  label?: string;
  prompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  animating?: boolean;
  status?: string;
};

// Node action callbacks are provided via context so node `data` stays serializable
// (persisted to Supabase without functions).
export const FrameActionsContext = createContext<{
  onAnimate: (id: string) => void;
  onDelete: (id: string) => void;
}>({ onAnimate: () => {}, onDelete: () => {} });

export function FrameNode({ id, data, selected }: NodeProps) {
  const d = data as FrameData;
  const { onAnimate, onDelete } = useContext(FrameActionsContext);

  return (
    <div
      className={`group relative w-[240px] overflow-hidden rounded-xl border-2 bg-[oklch(0.12_0_0)] transition-shadow ${
        selected ? "border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.25)]" : "border-white/15"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-pink-500" />

      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="truncate text-[11px] font-medium text-white/70">{d.label || "Frame"}</span>
        {d.status && d.status !== "done" && (
          <span className="ml-2 shrink-0 text-[10px] text-white/40">
            {d.status === "generating" ? "…" : d.status}
          </span>
        )}
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-black/40">
        {d.videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={d.videoUrl} className="h-full w-full object-cover" autoPlay loop muted playsInline />
        ) : d.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.imageUrl} alt={d.label || ""} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-white/25">
            {d.status === "generating" ? "✦ rendering…" : "empty"}
          </div>
        )}
        {d.animating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60">
            <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
            <span className="text-[10px] text-white/70">Animating…</span>
          </div>
        )}
      </div>

      {/* Prompt caption */}
      {d.prompt && (
        <div className="line-clamp-2 px-2.5 py-1.5 text-[10px] leading-snug text-white/40">{d.prompt}</div>
      )}

      {/* Hover actions (nodrag so clicks don't drag the node) */}
      <div className="absolute right-1.5 top-8 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {d.imageUrl && !d.videoUrl && (
          <button
            onClick={() => onAnimate(id)}
            disabled={d.animating}
            title="Animate this shot"
            className="nodrag nopan flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-500 disabled:opacity-50"
          >
            <Film className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => onDelete(id)}
          title="Delete"
          className="nodrag nopan flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-pink-500" />
    </div>
  );
}
