import crypto from "crypto";
import type { ShotType } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const VALID_SHOT_TYPES: ShotType[] = [
  "wide", "medium", "close-up", "extreme-close-up",
  "over-the-shoulder", "bird-eye", "low-angle",
  "high-angle", "dutch-angle", "pov",
];

// The orchestrator's job: take ONE natural-language idea and produce a complete,
// shot-by-shot animation plan with a LOCKED character description that is reused in
// every panel prompt — this is what keeps the character consistent across shots
// (the core thing single-shot AI video tools get wrong).

export interface AgentCharacter {
  name: string;
  /** Reusable appearance prompt injected into every panel for visual consistency. */
  appearance_prompt: string;
}

export interface AgentPanel {
  id: string;
  order: number;
  scene_description: string;
  dialogue: string;
  shot_type: ShotType;
  /** Visual-only prompt for this shot (character appearance is composed in separately). */
  image_prompt: string;
}

export interface AnimationPlan {
  title: string;
  logline: string;
  style_preset: string;
  character: AgentCharacter;
  panels: AgentPanel[];
}

interface OrchestrateParams {
  idea: string;
  style_preset?: string;
  panel_count?: number;
}

export async function planAnimation(
  params: OrchestrateParams,
  overrideApiKey?: string,
  overrideModel?: string
): Promise<AnimationPlan> {
  const apiKey = overrideApiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const panelCount = Math.max(3, Math.min(8, params.panel_count ?? 5));

  const systemPrompt = `You are the lead director of an AI animation studio. You coordinate a team of specialists (screenwriter, character designer, scene designer, storyboard artist) to turn a single idea into a complete, coherent animated short.

You MUST return ONLY a valid JSON object (no markdown, no commentary) with this exact shape:
{
  "title": "string",
  "logline": "one-sentence summary",
  "style_preset": "one of: anime, digital-art, cinematic, comic-book, fantasy-art, 3d-model, pixel-art, line-art",
  "character": {
    "name": "string",
    "appearance_prompt": "a detailed, REUSABLE visual description of the main character (species, age, hair, clothing, colors, distinguishing features) — this exact description will be reused in every shot to keep the character consistent"
  },
  "panels": [
    {
      "scene_description": "what happens in this shot",
      "dialogue": "spoken line or empty string",
      "shot_type": "wide|medium|close-up|extreme-close-up|over-the-shoulder|bird-eye|low-angle|high-angle|dutch-angle|pov",
      "image_prompt": "a detailed visual prompt for this shot describing the environment, action and composition — do NOT re-describe the character's fixed appearance here, only their pose/action"
    }
  ]
}

Rules:
- Tell a complete story with a beginning, middle and end across the panels.
- Keep the character's appearance_prompt fixed and specific so it reads identically across shots.
- Vary the shot types for cinematic pacing.`;

  const userPrompt = `Idea: ${params.idea}
${params.style_preset ? `Preferred style: ${params.style_preset}` : ""}
Produce exactly ${panelCount} panels.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: overrideModel || "openai/gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      temperature: 0.8,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenRouter error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from the orchestrator");
  }

  let jsonStr = String(content).trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let raw: {
    title?: string;
    logline?: string;
    style_preset?: string;
    character?: { name?: string; appearance_prompt?: string };
    panels?: Array<{
      scene_description?: string;
      dialogue?: string;
      shot_type?: string;
      image_prompt?: string;
    }>;
  };

  try {
    raw = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse orchestrator response as JSON");
  }

  const panels: AgentPanel[] = (raw.panels ?? []).map((p, index) => {
    const shotType = VALID_SHOT_TYPES.includes(p.shot_type as ShotType)
      ? (p.shot_type as ShotType)
      : "medium";
    return {
      id: crypto.randomUUID(),
      order: index,
      scene_description: p.scene_description || "",
      dialogue: p.dialogue || "",
      shot_type: shotType,
      image_prompt: p.image_prompt || p.scene_description || "",
    };
  });

  if (panels.length === 0) {
    throw new Error("Orchestrator returned no panels");
  }

  return {
    title: raw.title || "Untitled",
    logline: raw.logline || "",
    style_preset: raw.style_preset || params.style_preset || "anime",
    character: {
      name: raw.character?.name || "Main Character",
      appearance_prompt: raw.character?.appearance_prompt || "",
    },
    panels,
  };
}

/**
 * Compose the final image prompt for a panel, injecting the locked character
 * appearance + shot type. This is the character-consistency mechanism.
 */
export function composePanelPrompt(plan: AnimationPlan, panel: AgentPanel): string {
  const parts = [
    panel.image_prompt,
    plan.character.appearance_prompt
      ? `Character (${plan.character.name}): ${plan.character.appearance_prompt}`
      : "",
    `${panel.shot_type.replace(/-/g, " ")} shot`,
    plan.style_preset ? `${plan.style_preset} style` : "",
  ];
  return parts.filter(Boolean).join(". ");
}
