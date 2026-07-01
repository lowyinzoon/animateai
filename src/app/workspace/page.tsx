"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Share2,
  MoreHorizontal,
  Plus,
  Sparkles,
  Grid3X3,
  MousePointer2,
  Search,
  Minus,
  ChevronRight,
  SendHorizontal,
  Trash2,
  Loader2,
  Film,
  X,
} from "lucide-react";

// ── Types ──

interface WorkspaceFrame {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  videoUrl?: string;
  animating?: boolean;
  prompt?: string;
  label?: string;
}

interface ContextMenu {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  frameId?: string;
}

interface DragState {
  frameId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

interface ResizeState {
  frameId: string;
  edge: string;
  startX: number;
  startY: number;
  origW: number;
  origH: number;
  origX: number;
  origY: number;
}

// ── Skill card data ──

const skillCards = [
  {
    title: "STORY ANIME",
    subtitle: "Anime-style storytelling",
    bg: "bg-gradient-to-br from-[#2a1a2e] to-[#1a0a1e]",
    accent: "border-pink-500/30",
    href: "/script",
  },
  {
    title: "CHARACTER DESIGN",
    subtitle: "Original character creation",
    bg: "bg-gradient-to-br from-[#2a2a10] to-[#1a1a08]",
    accent: "border-yellow-500/30",
    href: "/character",
  },
  {
    title: "SCENE DESIGN",
    subtitle: "Environment & background",
    bg: "bg-gradient-to-br from-[#0a2a2a] to-[#081a1a]",
    accent: "border-cyan-500/30",
    href: "/scene",
  },
  {
    title: "ITEM DESIGN",
    subtitle: "Props & object design",
    bg: "bg-gradient-to-br from-[#0a0a2e] to-[#08081e]",
    accent: "border-indigo-500/30",
    href: "/image-gen",
  },
  {
    title: "PRODUCT AD",
    subtitle: "Commercial advertising",
    bg: "bg-gradient-to-br from-[#2e0a2a] to-[#1e081a]",
    accent: "border-pink-400/30",
    href: "/image-gen",
  },
];

// ── Component ──

export default function WorkspacePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Core state
  const [projectName, setProjectName] = useState("Untitled Project");
  const [prompt, setPrompt] = useState("");
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [frames, setFrames] = useState<WorkspaceFrame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [filmUrl, setFilmUrl] = useState<string | null>(null);
  const [showSkills, setShowSkills] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Interaction state
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avatar = user?.email?.[0]?.toUpperCase() ?? "U";

  // ── Coordinate helpers ──

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: screenX, y: screenY };
      const scale = zoom / 100;
      return {
        x: (screenX - rect.left - rect.width / 2 - panOffset.x) / scale,
        y: (screenY - rect.top - rect.height / 2 - panOffset.y) / scale,
      };
    },
    [zoom, panOffset]
  );

  // ── Frame CRUD ──

  const createFrame = useCallback(
    (cx: number, cy: number) => {
      const frame: WorkspaceFrame = {
        id: crypto.randomUUID(),
        x: cx - 128,
        y: cy - 128,
        width: 256,
        height: 256,
      };
      setFrames((prev) => [...prev, frame]);
      setSelectedFrameId(frame.id);
      return frame;
    },
    []
  );

  const deleteFrame = useCallback(
    (id: string) => {
      setFrames((prev) => prev.filter((f) => f.id !== id));
      if (selectedFrameId === id) setSelectedFrameId(null);
    },
    [selectedFrameId]
  );

  const updateFrame = useCallback(
    (id: string, updates: Partial<WorkspaceFrame>) => {
      setFrames((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  // ── Persistence ──

  const saveWorkspace = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const payload = {
      user_id: user.id,
      type: "canvas" as const,
      name: projectName,
      metadata: { frames, zoom, panOffset },
    };

    if (workspaceId) {
      await supabase
        .from("assets")
        .update({ name: projectName, metadata: { frames, zoom, panOffset } })
        .eq("id", workspaceId);
    } else {
      const { data } = await supabase
        .from("assets")
        .insert(payload)
        .select("id")
        .single();
      if (data) setWorkspaceId(data.id);
    }
  }, [user, projectName, frames, zoom, panOffset, workspaceId]);

  // Debounced auto-save
  useEffect(() => {
    if (!user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveWorkspace();
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [frames, projectName, zoom, panOffset, saveWorkspace, user]);

  // Load workspace on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "canvas")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.metadata) {
        const m = data.metadata as {
          frames?: WorkspaceFrame[];
          zoom?: number;
          panOffset?: { x: number; y: number };
        };
        if (m.frames) setFrames(m.frames);
        if (m.zoom) setZoom(m.zoom);
        if (m.panOffset) setPanOffset(m.panOffset);
        if (data.name) setProjectName(data.name);
        setWorkspaceId(data.id);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Image generation ──

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    // Determine target frame
    let targetId = selectedFrameId;
    if (!targetId) {
      const f = createFrame(0, 0);
      targetId = f.id;
    }

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), width: 1024, height: 1024 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      updateFrame(targetId, {
        imageUrl: data.image_url,
        prompt: prompt.trim(),
        label: prompt.trim().slice(0, 40),
      });
      toast.success("Image generated");
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedFrameId, createFrame, updateFrame]);

  // ── Agent: one prompt → full storyboard on the canvas ──

  // Generate an image for a specific frame; returns the image url (or null on failure).
  const generateIntoFrame = useCallback(
    async (
      frameId: string,
      imagePrompt: string,
      label: string,
      referenceImages?: string[]
    ) => {
      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: imagePrompt,
            width: 1024,
            height: 1024,
            ...(referenceImages?.length ? { reference_images: referenceImages } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        updateFrame(frameId, { imageUrl: data.image_url, prompt: imagePrompt, label });
        return data.image_url as string;
      } catch (err) {
        updateFrame(frameId, { label: `⚠ ${label}` });
        toast.error(err instanceof Error ? err.message : "Generation failed");
        return null;
      }
    },
    [updateFrame]
  );

  const handleAgentRun = useCallback(async () => {
    const idea = prompt.trim();
    if (!idea) {
      toast("Type your story idea first, then run the Agent.");
      return;
    }
    setIsGenerating(true);
    setAgentStatus("Directing your story…");

    try {
      // 1) Plan the whole short from a single idea.
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, panel_count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Orchestration failed");

      const plan = data.plan as {
        title: string;
        character: { name: string; appearance_prompt: string };
        panels: Array<{ id: string; final_prompt: string; scene_description: string }>;
      };

      setProjectName(plan.title || projectName);
      setShowSkills(false);
      setPrompt("");

      // 2) Lay out a character sheet frame + one frame per panel in a grid.
      const COL = 3;
      const STEP = 320;

      // Character frame (locked reference) on the left.
      const charFrame = createFrame(-STEP * 1.4, 0);
      updateFrame(charFrame.id, { label: `★ ${plan.character.name}` });

      const panelFrames = plan.panels.map((panel, i) => {
        const col = i % COL;
        const row = Math.floor(i / COL);
        const f = createFrame(col * STEP, (row - 0.5) * STEP);
        updateFrame(f.id, { label: `Shot ${i + 1}` });
        return { frameId: f.id, panel };
      });

      // 3) Render the locked character first, then feed that image as a visual
      //    reference into every shot so the character stays consistent.
      setAgentStatus(`Designing ${plan.character.name}…`);
      const characterUrl = await generateIntoFrame(
        charFrame.id,
        `Character reference sheet, full body, neutral pose, clean background. ${plan.character.appearance_prompt}`,
        `★ ${plan.character.name}`
      );
      const characterRefs = characterUrl ? [characterUrl] : undefined;

      for (let i = 0; i < panelFrames.length; i++) {
        const { frameId, panel } = panelFrames[i];
        setAgentStatus(`Rendering shot ${i + 1} of ${panelFrames.length}…`);
        await generateIntoFrame(frameId, panel.final_prompt, `Shot ${i + 1}`, characterRefs);
      }

      toast.success(`"${plan.title}" — ${panelFrames.length} shots generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Agent failed");
    } finally {
      setIsGenerating(false);
      setAgentStatus(null);
    }
  }, [prompt, projectName, createFrame, updateFrame, generateIntoFrame]);

  // ── Animate a shot: image → video (image-to-video via /api/generate-video) ──

  // Core: animate a single frame, returning the resulting video URL (or null).
  const animateOne = useCallback(
    async (frame: WorkspaceFrame): Promise<string | null> => {
      if (!frame.imageUrl) return null;
      if (frame.videoUrl) return frame.videoUrl;
      updateFrame(frame.id, { animating: true });
      try {
        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: frame.prompt || frame.label || "Animate this shot",
            image_url: frame.imageUrl,
            duration: 5,
            aspect_ratio: "16:9",
            resolution: "720p",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start animation");

        const { task_id, asset_id } = data;
        const started = Date.now();
        const MAX_MS = 5 * 60 * 1000;
        // Poll until the video task completes (seedance ~1-3 min).
        for (;;) {
          if (Date.now() - started > MAX_MS) throw new Error("Animation timed out");
          const q = new URLSearchParams({ task_id });
          if (asset_id) q.set("asset_id", asset_id);
          const r = await fetch(`/api/generate-video?${q.toString()}`);
          const j = await r.json();
          if (j.state === "success" && j.video_url) {
            updateFrame(frame.id, { videoUrl: j.video_url, animating: false });
            return j.video_url as string;
          }
          if (j.state === "fail") throw new Error(j.fail_msg || "Animation failed");
          await new Promise((r2) => setTimeout(r2, 5000));
        }
      } catch (err) {
        updateFrame(frame.id, { animating: false });
        toast.error(err instanceof Error ? err.message : "Animation failed");
        return null;
      }
    },
    [updateFrame]
  );

  const animateFrame = useCallback(
    async (frameId: string) => {
      const frame = frames.find((f) => f.id === frameId);
      if (!frame?.imageUrl) {
        toast("Generate an image in this frame first.");
        return;
      }
      if (frame.animating) return;
      toast("Animating shot…");
      const url = await animateOne(frame);
      if (url) toast.success("Shot animated");
    },
    [frames, animateOne]
  );

  // ── Assemble Film: animate every shot, then stitch into one video ──

  const handleAssembleFilm = useCallback(async () => {
    // Collect shot frames in order (Agent labels them "Shot N"; skip the ★ character sheet).
    const shots = frames
      .filter((f) => f.imageUrl && !(f.label ?? "").startsWith("★"))
      .sort((a, b) => {
        const na = parseInt((a.label ?? "").match(/Shot (\d+)/)?.[1] ?? "");
        const nb = parseInt((b.label ?? "").match(/Shot (\d+)/)?.[1] ?? "");
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.y - b.y || a.x - b.x;
      });

    if (shots.length === 0) {
      toast("Generate some shots first — run the Agent.");
      return;
    }

    setIsGenerating(true);
    try {
      // 0) Kick off the score in parallel (best-effort — film still assembles without it).
      let musicTaskId: string | null = null;
      try {
        const mres = await fetch("/api/generate-music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Instrumental cinematic background score for an animated short titled "${projectName}". Emotive, atmospheric, no vocals.`,
            instrumental: true,
          }),
        });
        const md = await mres.json();
        if (mres.ok) musicTaskId = md.task_id;
      } catch {
        /* music is optional */
      }

      // 1) Ensure every shot has a video clip (animate the ones that don't).
      const urls: string[] = [];
      for (let i = 0; i < shots.length; i++) {
        setAgentStatus(`Animating shot ${i + 1} of ${shots.length}…`);
        const url = await animateOne(shots[i]);
        if (url) urls.push(url);
      }
      if (urls.length === 0) throw new Error("No clips were produced");

      // 2) Wait for the score (usually done by now; give it up to ~3 min).
      let audioUrl: string | undefined;
      if (musicTaskId) {
        setAgentStatus("Scoring the music…");
        const started = Date.now();
        while (Date.now() - started < 3 * 60 * 1000) {
          try {
            const r = await fetch(`/api/generate-music?task_id=${musicTaskId}`);
            const j = await r.json();
            if (j.state === "success" && j.audio_url) {
              audioUrl = j.audio_url;
              break;
            }
            if (j.state === "fail") break;
          } catch {
            break;
          }
          await new Promise((r2) => setTimeout(r2, 5000));
        }
      }

      // 3) Stitch clips (+ score) into a single film server-side.
      setAgentStatus(`Assembling ${urls.length} shots into your film…`);
      const res = await fetch("/api/compose-film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_urls: urls, title: projectName, audio_url: audioUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Film assembly failed");

      setFilmUrl(data.film_url);
      toast.success("Your film is ready 🎬");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Film assembly failed");
    } finally {
      setIsGenerating(false);
      setAgentStatus(null);
    }
  }, [frames, projectName, animateOne]);

  // ── Canvas event handlers ──

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-frame-id]")) return;
      const pos = screenToCanvas(e.clientX, e.clientY);
      createFrame(pos.x, pos.y);
    },
    [screenToCanvas, createFrame]
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const frameEl = (e.target as HTMLElement).closest("[data-frame-id]");
      const pos = screenToCanvas(e.clientX, e.clientY);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        canvasX: pos.x,
        canvasY: pos.y,
        frameId: frameEl?.getAttribute("data-frame-id") ?? undefined,
      });
    },
    [screenToCanvas]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Close context menu on any click
      if (contextMenu) setContextMenu(null);

      // Middle-click or space+left → start panning
      if (e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panOffsetStartRef.current = { ...panOffset };
        return;
      }

      // Left-click on canvas background → deselect
      if (e.button === 0) {
        const frameEl = (e.target as HTMLElement).closest("[data-frame-id]");
        if (!frameEl) {
          setSelectedFrameId(null);
        }
      }
    },
    [contextMenu, panOffset]
  );

  // Frame drag start (called from frame's onMouseDown)
  const handleFrameDragStart = useCallback(
    (e: React.MouseEvent, frameId: string) => {
      if (e.button !== 0) return;
      // Don't start drag if clicking a resize handle
      if ((e.target as HTMLElement).dataset.resizeHandle) return;
      e.stopPropagation();
      setSelectedFrameId(frameId);
      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;
      setDragging({
        frameId,
        startX: e.clientX,
        startY: e.clientY,
        origX: frame.x,
        origY: frame.y,
      });
    },
    [frames]
  );

  // Resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, frameId: string, edge: string) => {
      e.stopPropagation();
      e.preventDefault();
      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;
      setResizing({
        frameId,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origW: frame.width,
        origH: frame.height,
        origX: frame.x,
        origY: frame.y,
      });
    },
    [frames]
  );

  // Global mouse move/up for drag, resize, pan
  useEffect(() => {
    const scale = zoom / 100;

    const onMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPanOffset({
          x: panOffsetStartRef.current.x + dx,
          y: panOffsetStartRef.current.y + dy,
        });
        return;
      }

      if (dragging) {
        const dx = (e.clientX - dragging.startX) / scale;
        const dy = (e.clientY - dragging.startY) / scale;
        updateFrame(dragging.frameId, {
          x: dragging.origX + dx,
          y: dragging.origY + dy,
        });
        return;
      }

      if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        const minSize = 64;
        const edge = resizing.edge;

        let newW = resizing.origW;
        let newH = resizing.origH;
        let newX = resizing.origX;
        let newY = resizing.origY;

        if (edge.includes("r")) newW = Math.max(minSize, resizing.origW + dx);
        if (edge.includes("b")) newH = Math.max(minSize, resizing.origH + dy);
        if (edge.includes("l")) {
          newW = Math.max(minSize, resizing.origW - dx);
          if (newW > minSize) newX = resizing.origX + dx;
        }
        if (edge.includes("t")) {
          newH = Math.max(minSize, resizing.origH - dy);
          if (newH > minSize) newY = resizing.origY + dy;
        }

        updateFrame(resizing.frameId, {
          width: newW,
          height: newH,
          x: newX,
          y: newY,
        });
      }
    };

    const onMouseUp = () => {
      setDragging(null);
      setResizing(null);
      setIsPanning(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, resizing, isPanning, zoom, updateFrame]);

  // Ctrl+scroll → zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => {
        const next = z - Math.sign(e.deltaY) * 10;
        return Math.min(200, Math.max(10, next));
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedFrameId) {
        deleteFrame(selectedFrameId);
      }
      if (e.key === "Escape") {
        setSelectedFrameId(null);
        setContextMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedFrameId, deleteFrame]);

  // ── Prompt bar toolbar actions ──

  const toolbarAction = useCallback(
    (label: string) => {
      switch (label) {
        case "Script":
          router.push("/script");
          break;
        case "Skill":
          setShowSkills((v) => !v);
          break;
        case "Agent":
          handleAgentRun();
          break;
        case "Styles":
          toast("Styles — coming soon");
          break;
        case "Assets":
          router.push("/assets");
          break;
      }
    },
    [router, handleAgentRun]
  );

  // ── Render ──

  const scale = zoom / 100;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[oklch(0.08_0_0)]">
      {/* ── Top Bar ── */}
      <header className="relative z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[oklch(0.10_0_0)] px-3">
        {/* Left */}
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-white cursor-pointer"
            fill="currentColor"
            onClick={() => router.push("/home")}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-sm text-white outline-none placeholder:text-white/40 w-36"
          />
          <button className="text-white/40 hover:text-white/70 transition-colors">
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button className="text-white/40 hover:text-white/70 transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAssembleFilm}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white hover:bg-pink-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Animate every shot and stitch them into one film"
          >
            <Film className="h-3.5 w-3.5" />
            Assemble Film
          </button>
          <button className="rounded-md border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/5 transition-colors">
            Publish
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1">
            <span className="text-[11px] text-white/60">154 BASE</span>
          </div>
          <button
            onClick={signOut}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-600 text-[11px] font-semibold text-white"
          >
            {avatar}
          </button>
        </div>
      </header>

      {/* ── Canvas Area ── */}
      <main
        ref={canvasRef}
        className="relative flex-1 overflow-hidden canvas-dots select-none"
        style={{ cursor: isPanning ? "grabbing" : "default" }}
        onDoubleClick={handleCanvasDoubleClick}
        onContextMenu={handleCanvasContextMenu}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Zoom/pan container */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            {/* Frames */}
            {frames.map((frame) => {
              const isSelected = frame.id === selectedFrameId;
              return (
                <div
                  key={frame.id}
                  data-frame-id={frame.id}
                  className={`absolute group rounded-lg border-2 transition-shadow ${
                    isSelected
                      ? "border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                      : "border-white/20 hover:border-white/40"
                  }`}
                  style={{
                    left: frame.x,
                    top: frame.y,
                    width: frame.width,
                    height: frame.height,
                    cursor: dragging ? "grabbing" : "grab",
                  }}
                  onMouseDown={(e) => handleFrameDragStart(e, frame.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFrameId(frame.id);
                  }}
                >
                  {/* Content */}
                  {frame.videoUrl ? (
                    <video
                      src={frame.videoUrl}
                      className="h-full w-full rounded-md object-cover pointer-events-none"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : frame.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={frame.imageUrl}
                      alt={frame.label || "Generated"}
                      className="h-full w-full rounded-md object-cover pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md bg-white/[0.03]">
                      <Plus className="h-8 w-8 text-white/20" />
                      <span className="text-[10px] text-white/30">
                        Empty frame
                      </span>
                    </div>
                  )}

                  {/* Animating overlay */}
                  {frame.animating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-black/60 pointer-events-none">
                      <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
                      <span className="text-[10px] text-white/70">Animating…</span>
                    </div>
                  )}

                  {/* Label bar */}
                  {frame.label && (
                    <div className="absolute bottom-0 left-0 right-0 rounded-b-md bg-black/70 px-2 py-1 text-[10px] text-white/70 truncate">
                      {frame.label}
                    </div>
                  )}

                  {/* Selected controls */}
                  {isSelected && (
                    <>
                      {/* Animate button — only when there's an image to animate */}
                      {frame.imageUrl && !frame.videoUrl && (
                        <button
                          className="absolute -top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-500 z-10 disabled:opacity-50"
                          title="Animate this shot"
                          disabled={frame.animating}
                          onClick={(e) => {
                            e.stopPropagation();
                            animateFrame(frame.id);
                          }}
                        >
                          {frame.animating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Film className="h-3 w-3" />
                          )}
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFrame(frame.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Resize handles: 4 corners */}
                      {["tl", "tr", "bl", "br"].map((edge) => (
                        <div
                          key={edge}
                          data-resize-handle="true"
                          className="absolute h-3 w-3 rounded-full bg-pink-500 border-2 border-white z-10"
                          style={{
                            cursor:
                              edge === "tl" || edge === "br"
                                ? "nwse-resize"
                                : "nesw-resize",
                            top: edge.includes("t") ? -6 : undefined,
                            bottom: edge.includes("b") ? -6 : undefined,
                            left: edge.includes("l") ? -6 : undefined,
                            right: edge.includes("r") ? -6 : undefined,
                          }}
                          onMouseDown={(e) => {
                            const mapped =
                              edge === "tl"
                                ? "tl"
                                : edge === "tr"
                                ? "tr"
                                : edge === "bl"
                                ? "bl"
                                : "br";
                            handleResizeStart(e, frame.id, mapped);
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hint overlay — only when no frames */}
        {frames.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="mb-10 flex flex-col items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10">
                <Sparkles className="h-4 w-4 text-pink-400" />
              </div>
              <p className="text-sm text-white/40 text-center max-w-xs">
                Double or right click anywhere to create a frame and start
                generating.
              </p>
            </div>
          </div>
        )}

        {/* Agent status pill */}
        {agentStatus && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full border border-pink-500/30 bg-black/70 px-4 py-1.5 backdrop-blur-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-pink-400" />
            <span className="text-xs text-white/80">{agentStatus}</span>
          </div>
        )}

        {/* Skills Row */}
        {showSkills && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 overflow-x-auto px-6 pb-2 no-scrollbar max-w-full">
            {/* Add Frame card */}
            <button
              onClick={() => createFrame(0, 0)}
              className="flex h-[140px] w-[110px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60 transition-colors bg-black/40 backdrop-blur-sm"
            >
              <Plus className="h-6 w-6" />
              <span className="text-[10px] font-medium">Add Frame</span>
            </button>

            {/* Skill cards */}
            {skillCards.map((card) => (
              <button
                key={card.title}
                onClick={() => router.push(card.href)}
                className={`flex h-[140px] w-[110px] shrink-0 flex-col justify-end rounded-xl border ${card.accent} ${card.bg} p-3 text-left transition-transform hover:scale-105`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {card.title}
                </span>
                <span className="mt-0.5 text-[9px] text-white/50">
                  {card.subtitle}
                </span>
              </button>
            ))}

            {/* All Skills link */}
            <button
              onClick={() => router.push("/home")}
              className="flex shrink-0 items-center gap-0.5 text-xs text-white/40 hover:text-white/70 transition-colors whitespace-nowrap"
            >
              All Skills <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Context menu */}
        {contextMenu && (
          <div
            className="fixed z-50 min-w-[160px] rounded-lg border border-white/10 bg-[oklch(0.13_0_0)] py-1 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.frameId ? (
              <>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06]"
                  onClick={() => {
                    setSelectedFrameId(contextMenu.frameId!);
                    setContextMenu(null);
                    // Focus prompt bar
                    const ta = document.querySelector(
                      "textarea"
                    ) as HTMLTextAreaElement | null;
                    ta?.focus();
                  }}
                >
                  <Sparkles className="h-3 w-3" /> Generate Image
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06] disabled:opacity-40"
                  disabled={!frames.find((f) => f.id === contextMenu.frameId)?.imageUrl}
                  onClick={() => {
                    animateFrame(contextMenu.frameId!);
                    setContextMenu(null);
                  }}
                >
                  <Film className="h-3 w-3" /> Animate Frame
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/[0.06]"
                  onClick={() => {
                    deleteFrame(contextMenu.frameId!);
                    setContextMenu(null);
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Delete Frame
                </button>
              </>
            ) : (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06]"
                onClick={() => {
                  createFrame(contextMenu.canvasX, contextMenu.canvasY);
                  setContextMenu(null);
                }}
              >
                <Plus className="h-3 w-3" /> Add Frame Here
              </button>
            )}
          </div>
        )}

        {/* Right-edge floating tools */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-white/40 hover:text-white/70 transition-colors">
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-white/40 hover:text-white/70 transition-colors">
            <MousePointer2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom-right zoom controls */}
        <div className="absolute bottom-20 right-3 flex items-center gap-1 rounded-lg bg-white/[0.06] border border-white/10 p-0.5 z-10">
          <button
            onClick={() => {
              setZoom(100);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="flex h-7 w-7 items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            title="Reset zoom & pan"
          >
            <Search className="h-3 w-3" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(10, z - 10))}
            className="flex h-7 w-7 items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="min-w-[38px] text-center text-[11px] text-white/50">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="flex h-7 w-7 items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </main>

      {/* ── Bottom Prompt Bar ── */}
      <div className="relative z-20 flex shrink-0 justify-center border-t border-white/[0.06] bg-[oklch(0.10_0_0)] px-4 py-3">
        <div className="w-full max-w-[640px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.04]">
            {/* Textarea */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Drag / Paste an image here to try Skills, Styles & Assets."
              rows={2}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm text-white outline-none placeholder:text-white/30"
            />

            {/* Toolbar row */}
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => createFrame(0, 0)}
                  className="rounded-md p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
                  title="Add frame"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <span className="mx-1 h-4 w-px bg-white/10" />
                {["Script", "Skill", "Agent", "Styles", "Assets"].map(
                  (label) => (
                    <button
                      key={label}
                      onClick={() => toolbarAction(label)}
                      className="rounded-md px-2 py-1 text-[11px] text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <SendHorizontal className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Finished Film modal ── */}
      {filmUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setFilmUrl(null)}
        >
          <div
            className="w-full max-w-3xl rounded-xl border border-white/10 bg-[oklch(0.11_0_0)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Film className="h-4 w-4 text-pink-400" /> {projectName}
              </span>
              <button
                onClick={() => setFilmUrl(null)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video
              src={filmUrl}
              controls
              autoPlay
              className="w-full rounded-lg bg-black"
            />
            <div className="mt-3 flex justify-end gap-2">
              <a
                href={filmUrl}
                download
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
              >
                Download
              </a>
              <button
                onClick={() => setFilmUrl(null)}
                className="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
