"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Share2,
  MoreHorizontal,
  Plus,
  Sparkles,
  SendHorizontal,
  Loader2,
  Film,
  Maximize2,
  X,
} from "lucide-react";
import { FrameNode, FrameActionsContext, type FrameData } from "@/components/workspace/frame-node";

// ── Plan (dialogue/approval) types ──
interface PlanShot {
  id: string;
  scene_description: string;
  dialogue: string;
  shot_type: string;
  image_prompt: string;
}
interface PlanDraft {
  title: string;
  logline: string;
  style_preset: string;
  characterName: string;
  appearance: string;
  shots: PlanShot[];
}
interface AgentLogItem {
  agent: string;
  text: string;
}

function composeShotPrompt(plan: PlanDraft, shot: PlanShot): string {
  return [
    shot.image_prompt,
    plan.appearance ? `Character (${plan.characterName}): ${plan.appearance}` : "",
    `${shot.shot_type.replace(/-/g, " ")} shot`,
    plan.style_preset ? `${plan.style_preset} style` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

const skillCards = [
  { title: "STORY ANIME", subtitle: "Anime-style storytelling", bg: "from-[#2a1a2e] to-[#1a0a1e]", accent: "border-pink-500/30", preset: "An anime-style short story about " },
  { title: "CHARACTER DESIGN", subtitle: "Original character creation", bg: "from-[#2a2a10] to-[#1a1a08]", accent: "border-yellow-500/30", preset: "A story starring an original character: " },
  { title: "SCENE DESIGN", subtitle: "Environment & background", bg: "from-[#0a2a2a] to-[#081a1a]", accent: "border-cyan-500/30", preset: "A cinematic short set in " },
  { title: "PRODUCT AD", subtitle: "Commercial advertising", bg: "from-[#2e0a2a] to-[#1e081a]", accent: "border-pink-400/30", preset: "A short product advertisement for " },
];

const nodeTypes = { frame: FrameNode };
const defaultEdgeOptions = {
  style: { stroke: "rgba(255,255,255,0.35)", strokeWidth: 2, strokeDasharray: "2 7" },
};
const PIPELINE_TABS = ["总览", "剧本", "角色", "场景", "分镜", "视频"];

const nid = () => `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function WorkspaceInner() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { getNode, getNodes, setCenter, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FrameData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [filmUrl, setFilmUrl] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState<PlanDraft | null>(null);
  const [agentLog, setAgentLog] = useState<AgentLogItem[]>([]);
  const [showSkills, setShowSkills] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const avatar = user?.email?.[0]?.toUpperCase() ?? "U";
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patchData = useCallback(
    (id: string, patch: Partial<FrameData>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
    },
    [setNodes]
  );

  // ── Persistence ──
  const saveWorkspace = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const clean = nodes.map((n) => ({
      id: n.id,
      type: "frame",
      position: n.position,
      data: {
        label: n.data.label,
        prompt: n.data.prompt,
        imageUrl: n.data.imageUrl,
        videoUrl: n.data.videoUrl,
      },
    }));
    const metadata = { flow: { nodes: clean, edges }, name: projectName };
    if (workspaceId) {
      await supabase.from("assets").update({ name: projectName, metadata }).eq("id", workspaceId);
    } else {
      const { data } = await supabase
        .from("assets")
        .insert({ user_id: user.id, type: "canvas", name: projectName, metadata })
        .select("id")
        .single();
      if (data) setWorkspaceId(data.id);
    }
  }, [user, nodes, edges, projectName, workspaceId]);

  useEffect(() => {
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveWorkspace(), 2000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [nodes, edges, projectName, saveWorkspace, user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "canvas")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      const flow = (data?.metadata as { flow?: { nodes: Node<FrameData>[]; edges: Edge[] } })?.flow;
      if (flow?.nodes) {
        setNodes(flow.nodes);
        setEdges(flow.edges || []);
        if (data?.name) setProjectName(data.name);
        setWorkspaceId(data!.id);
        setShowSkills(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Generation ──
  const generateIntoNode = useCallback(
    async (id: string, imagePrompt: string, label: string, referenceImages?: string[]) => {
      patchData(id, { status: "generating" });
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
        patchData(id, { imageUrl: data.image_url, prompt: imagePrompt, label, status: "done" });
        return data.image_url as string;
      } catch (err) {
        patchData(id, { status: "error", label: `⚠ ${label}` });
        toast.error(err instanceof Error ? err.message : "Generation failed");
        return null;
      }
    },
    [patchData]
  );

  const animateOne = useCallback(
    async (node: Node<FrameData>): Promise<string | null> => {
      const d = node.data;
      if (!d.imageUrl) return null;
      if (d.videoUrl) return d.videoUrl;
      patchData(node.id, { animating: true });
      try {
        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: d.prompt || d.label || "Animate this shot",
            image_url: d.imageUrl,
            duration: 5,
            aspect_ratio: "16:9",
            resolution: "720p",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start animation");
        const { task_id, asset_id } = data;
        const started = Date.now();
        for (;;) {
          if (Date.now() - started > 5 * 60 * 1000) throw new Error("Animation timed out");
          const q = new URLSearchParams({ task_id });
          if (asset_id) q.set("asset_id", asset_id);
          const r = await fetch(`/api/generate-video?${q.toString()}`);
          const j = await r.json();
          if (j.state === "success" && j.video_url) {
            patchData(node.id, { videoUrl: j.video_url, animating: false });
            return j.video_url as string;
          }
          if (j.state === "fail") throw new Error(j.fail_msg || "Animation failed");
          await new Promise((r2) => setTimeout(r2, 5000));
        }
      } catch (err) {
        patchData(node.id, { animating: false });
        toast.error(err instanceof Error ? err.message : "Animation failed");
        return null;
      }
    },
    [patchData]
  );

  // ── Node actions (via context) ──
  const onAnimate = useCallback(
    (id: string) => {
      const n = getNode(id) as Node<FrameData> | undefined;
      if (!n?.data.imageUrl) {
        toast("Generate an image in this frame first.");
        return;
      }
      if (n.data.animating) return;
      toast("Animating shot…");
      animateOne(n).then((url) => url && toast.success("Shot animated"));
    },
    [getNode, animateOne]
  );
  const onDelete = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges]
  );

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges]);

  const addNode = useCallback(() => {
    const id = nid();
    setNodes((nds) => [
      ...nds,
      { id, type: "frame", position: { x: Math.random() * 200, y: Math.random() * 200 }, data: {} },
    ]);
  }, [setNodes]);

  // ── Dock: single generate ──
  const handleGenerate = useCallback(async () => {
    const p = prompt.trim();
    if (!p) return;
    const id = nid();
    setNodes((nds) => [...nds, { id, type: "frame", position: { x: 0, y: 0 }, data: { label: p.slice(0, 30) } }]);
    setPrompt("");
    setIsGenerating(true);
    try {
      await generateIntoNode(id, p, p.slice(0, 30));
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, setNodes, generateIntoNode]);

  // ── Agent: plan then approve ──
  const handleAgentPlan = useCallback(async () => {
    const idea = prompt.trim();
    if (!idea) {
      toast("Type your story idea first, then run the Agent.");
      return;
    }
    setIsGenerating(true);
    setAgentStatus("The agent team is planning your story…");
    setAgentLog([]);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, panel_count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Orchestration failed");
      const plan = data.plan;
      const draft: PlanDraft = {
        title: plan.title || "Untitled",
        logline: plan.logline || "",
        style_preset: plan.style_preset || "anime",
        characterName: plan.character?.name || "Main Character",
        appearance: plan.character?.appearance_prompt || "",
        shots: (plan.panels || []).map((p: PlanShot) => ({
          id: p.id,
          scene_description: p.scene_description || "",
          dialogue: p.dialogue || "",
          shot_type: p.shot_type || "medium",
          image_prompt: p.image_prompt || p.scene_description || "",
        })),
      };
      setAgentLog([
        { agent: "Art Director", text: `Set the visual style: ${draft.style_preset}.` },
        { agent: "Scriptwriter", text: `"${draft.logline}" — ${draft.shots.length} shots.` },
        { agent: "Character Designer", text: `Locked character: ${draft.characterName}.` },
        { agent: "Storyboard Artist", text: `Laid out ${draft.shots.length} shots.` },
        { agent: "Sound Director", text: `Will score the film on assemble.` },
      ]);
      setPlanDraft(draft);
      setProjectName(draft.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Agent failed");
    } finally {
      setIsGenerating(false);
      setAgentStatus(null);
    }
  }, [prompt]);

  const handleApprovePlan = useCallback(async () => {
    if (!planDraft) return;
    const plan = planDraft;
    const shots = plan.shots.filter((s) => s.image_prompt.trim());
    if (shots.length === 0) {
      toast("Add at least one shot before generating.");
      return;
    }
    setPlanDraft(null);
    setShowSkills(false);
    setPrompt("");
    setIsGenerating(true);
    try {
      // Build a connected vertical flow: character → shot → shot …
      const charId = nid();
      const shotDefs = shots.map((shot) => ({ id: nid(), shot }));
      const newNodes: Node<FrameData>[] = [
        { id: charId, type: "frame", position: { x: 0, y: 0 }, data: { label: `★ ${plan.characterName}` } },
        ...shotDefs.map((s, i) => ({
          id: s.id,
          type: "frame",
          position: { x: 0, y: (i + 1) * 340 },
          data: { label: `Shot ${i + 1}` } as FrameData,
        })),
      ];
      const newEdges: Edge[] = [];
      let prev = charId;
      for (const s of shotDefs) {
        newEdges.push({ id: `e-${prev}-${s.id}`, source: prev, target: s.id });
        prev = s.id;
      }
      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 100);

      setAgentStatus(`Designing ${plan.characterName}…`);
      const charUrl = await generateIntoNode(
        charId,
        `Character reference sheet, full body, neutral pose, clean background. ${plan.appearance}`,
        `★ ${plan.characterName}`
      );
      const refs = charUrl ? [charUrl] : undefined;

      for (let i = 0; i < shotDefs.length; i++) {
        setAgentStatus(`Rendering shot ${i + 1} of ${shotDefs.length}…`);
        await generateIntoNode(shotDefs[i].id, composeShotPrompt(plan, shotDefs[i].shot), `Shot ${i + 1}`, refs);
      }
      toast.success(`"${plan.title}" — ${shotDefs.length} shots generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
      setAgentStatus(null);
    }
  }, [planDraft, setNodes, setEdges, fitView, generateIntoNode]);

  // ── Assemble film ──
  const handleAssembleFilm = useCallback(async () => {
    const shots = getNodes()
      .filter((n) => (n.data as FrameData).imageUrl && !((n.data as FrameData).label ?? "").startsWith("★"))
      .sort((a, b) => {
        const na = parseInt(((a.data as FrameData).label ?? "").match(/Shot (\d+)/)?.[1] ?? "");
        const nb = parseInt(((b.data as FrameData).label ?? "").match(/Shot (\d+)/)?.[1] ?? "");
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.position.y - b.position.y;
      }) as Node<FrameData>[];
    if (shots.length === 0) {
      toast("Generate some shots first — run the Agent.");
      return;
    }
    setIsGenerating(true);
    try {
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
      } catch {}

      const urls: string[] = [];
      for (let i = 0; i < shots.length; i++) {
        setAgentStatus(`Animating shot ${i + 1} of ${shots.length}…`);
        const url = await animateOne(shots[i]);
        if (url) urls.push(url);
      }
      if (urls.length === 0) throw new Error("No clips were produced");

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
  }, [getNodes, projectName, animateOne]);

  const handlePublish = useCallback(async () => {
    const withImg = getNodes().filter((n) => (n.data as FrameData).imageUrl);
    const cover =
      (withImg.find((n) => !((n.data as FrameData).label ?? "").startsWith("★"))?.data as FrameData | undefined)?.imageUrl ||
      (withImg[0]?.data as FrameData | undefined)?.imageUrl ||
      null;
    if (!cover && !filmUrl) {
      toast("Generate shots or assemble a film before publishing.");
      return;
    }
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectName, cover_url: cover, video_url: filmUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      toast.success("Published to the gallery 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    }
  }, [getNodes, projectName, filmUrl]);

  // ── Pipeline tabs ──
  const focusStage = useCallback(
    (stage: string) => {
      const ns = getNodes();
      if (ns.length === 0) return;
      if (stage === "总览") {
        fitView({ duration: 400, padding: 0.2 });
        return;
      }
      const first = (pred: (l: string) => boolean) => ns.find((n) => pred(((n.data as FrameData).label ?? "")));
      const pick =
        stage === "角色"
          ? first((l) => l.startsWith("★"))
          : stage === "视频"
          ? [...ns].reverse().find((n) => (((n.data as FrameData).label ?? "").startsWith("Shot")))
          : first((l) => l.startsWith("Shot")) ?? ns[0];
      if (pick) setCenter(pick.position.x + 120, pick.position.y + 140, { zoom: 0.9, duration: 400 });
    },
    [getNodes, setCenter, fitView]
  );

  return (
    <FrameActionsContext.Provider value={{ onAnimate, onDelete }}>
      <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[oklch(0.08_0_0)]">
        {/* Top bar */}
        <header className="relative z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[oklch(0.10_0_0)] px-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/gallery")}
              title="Gallery"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-600 text-white hover:bg-pink-500 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-36 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
            <button className="text-white/40 hover:text-white/70">
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button className="text-white/40 hover:text-white/70">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pipeline tabs */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-5 md:flex">
            {PIPELINE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => focusStage(tab)}
                className="flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white"
              >
                <span className="h-1 w-1 rounded-full bg-pink-500/70" />
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAssembleFilm}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Film className="h-3.5 w-3.5" />
              Assemble Film
            </button>
            <button
              onClick={handlePublish}
              className="rounded-md border border-white/10 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-white/5"
            >
              Publish
            </button>
            <button
              onClick={signOut}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-600 text-[11px] font-semibold text-white"
            >
              {avatar}
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            className="bg-[oklch(0.08_0_0)]"
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#2a2a35" />
            <MiniMap
              pannable
              zoomable
              nodeColor="#3a3a46"
              maskColor="rgba(0,0,0,0.6)"
              className="!bottom-4 !right-4 !border !border-white/10 !bg-[oklch(0.11_0_0)]"
            />
            <Controls
              showInteractive={false}
              className="!bottom-4 !left-[360px] !rounded-lg !border !border-white/10 !bg-[oklch(0.11_0_0)]"
            />
          </ReactFlow>

          {/* Add-frame button (top-right of canvas) */}
          <button
            onClick={addNode}
            title="Add frame"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-500"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Agent status pill */}
          {agentStatus && (
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-pink-500/30 bg-black/70 px-4 py-1.5 backdrop-blur-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-pink-400" />
              <span className="text-xs text-white/80">{agentStatus}</span>
            </div>
          )}
        </div>

        {/* Oii Agent dock (bottom-left) */}
        <div className="absolute bottom-4 left-4 z-30 w-[340px] rounded-xl border border-white/10 bg-[oklch(0.11_0_0)]/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" /> Agent
            </span>
            <button onClick={() => setShowSkills((v) => !v)} className="text-white/40 hover:text-white/70">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {showSkills && (
            <div className="flex gap-2 overflow-x-auto px-3 pt-2 no-scrollbar">
              {skillCards.map((c) => (
                <button
                  key={c.title}
                  onClick={() => {
                    setPrompt(c.preset);
                    setShowSkills(false);
                  }}
                  className={`flex h-16 w-24 shrink-0 flex-col justify-end rounded-lg border bg-gradient-to-br ${c.accent} ${c.bg} p-2 text-left transition-transform hover:scale-105`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white">{c.title}</span>
                </button>
              ))}
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="描述你的故事，然后点 Agent 生成分镜…"
            rows={2}
            className="w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-sm text-white outline-none placeholder:text-white/30"
          />

          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handleAgentPlan}
                disabled={isGenerating}
                className="rounded-md bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/80 hover:bg-white/[0.1] disabled:opacity-40"
              >
                ✦ Agent
              </button>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-600 text-white transition-colors hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SendHorizontal className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Plan review panel */}
        {planDraft && (
          <div className="fixed right-4 top-16 bottom-4 z-40 flex w-[360px] flex-col rounded-xl border border-white/10 bg-[oklch(0.11_0_0)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-pink-400" /> Review plan
              </span>
              <button onClick={() => setPlanDraft(null)} className="text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
              <div className="space-y-1.5">
                {agentLog.map((item, i) => (
                  <div key={i} className="rounded-lg bg-white/[0.04] px-3 py-1.5">
                    <div className="text-[10px] font-semibold text-pink-400">{item.agent}</div>
                    <div className="text-[11px] text-white/70">{item.text}</div>
                  </div>
                ))}
              </div>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Title</span>
                <input
                  value={planDraft.title}
                  onChange={(e) => setPlanDraft((p) => (p ? { ...p, title: e.target.value } : p))}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-white outline-none focus:border-pink-500/50"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Character — {planDraft.characterName}</span>
                <textarea
                  value={planDraft.appearance}
                  onChange={(e) => setPlanDraft((p) => (p ? { ...p, appearance: e.target.value } : p))}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/90 outline-none focus:border-pink-500/50"
                />
              </label>
              <div>
                <span className="text-[10px] uppercase tracking-wide text-white/40">Shots ({planDraft.shots.length})</span>
                <div className="mt-1.5 space-y-2">
                  {planDraft.shots.map((shot, i) => (
                    <div key={shot.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-white/60">
                          Shot {i + 1} · {shot.shot_type.replace(/-/g, " ")}
                        </span>
                        <button
                          onClick={() => setPlanDraft((p) => (p ? { ...p, shots: p.shots.filter((s) => s.id !== shot.id) } : p))}
                          className="text-white/30 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <textarea
                        value={shot.image_prompt}
                        onChange={(e) =>
                          setPlanDraft((p) =>
                            p ? { ...p, shots: p.shots.map((s) => (s.id === shot.id ? { ...s, image_prompt: e.target.value } : s)) } : p
                          )
                        }
                        rows={2}
                        className="w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/90 outline-none focus:border-pink-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
              <button onClick={() => setPlanDraft(null)} className="flex-1 rounded-md border border-white/10 py-2 text-xs text-white/70 hover:bg-white/5">
                Discard
              </button>
              <button
                onClick={handleApprovePlan}
                disabled={isGenerating}
                className="flex flex-[2] items-center justify-center gap-1.5 rounded-md bg-pink-600 py-2 text-xs font-semibold text-white hover:bg-pink-500 disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate storyboard
              </button>
            </div>
          </div>
        )}

        {/* Film modal */}
        {filmUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setFilmUrl(null)}>
            <div className="w-full max-w-3xl rounded-xl border border-white/10 bg-[oklch(0.11_0_0)] p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  <Film className="h-4 w-4 text-pink-400" /> {projectName}
                </span>
                <button onClick={() => setFilmUrl(null)} className="text-white/50 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={filmUrl} controls autoPlay className="w-full rounded-lg bg-black" />
              <div className="mt-3 flex justify-end gap-2">
                <a href={filmUrl} download className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5">
                  Download
                </a>
                <button onClick={() => setFilmUrl(null)} className="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-500">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FrameActionsContext.Provider>
  );
}

export default function WorkspacePage() {
  return (
    <ReactFlowProvider>
      <WorkspaceInner />
    </ReactFlowProvider>
  );
}
