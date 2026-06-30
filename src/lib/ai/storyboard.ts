import crypto from "crypto";
import type { StoryboardPanel, ShotType } from "@/types";

const OPENAI_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const VALID_SHOT_TYPES: ShotType[] = [
  "wide", "medium", "close-up", "extreme-close-up",
  "over-the-shoulder", "bird-eye", "low-angle",
  "high-angle", "dutch-angle", "pov",
];

export async function parseScriptToPanels(
  scriptContent: string,
  overrideApiKey?: string,
  overrideModel?: string
): Promise<StoryboardPanel[]> {
  const apiKey = overrideApiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const systemPrompt = `You are a professional storyboard artist and film director. You analyze scripts and break them down into visual storyboard panels.

For each panel, you must provide:
- scene_description: A concise visual description of what's shown in the panel
- dialogue: Any dialogue spoken in this panel (empty string if none)
- action_notes: Camera movement, character actions, transitions
- shot_type: One of: wide, medium, close-up, extreme-close-up, over-the-shoulder, bird-eye, low-angle, high-angle, dutch-angle, pov
- duration_seconds: Estimated duration in seconds (2-10)
- image_prompt: A detailed prompt suitable for AI image generation that captures the visual of this panel

Return ONLY a valid JSON array of panel objects. No markdown, no explanation, just the JSON array.`;

  const userPrompt = `Break this script into storyboard panels (aim for 6-15 panels depending on script length):

${scriptContent}

Return a JSON array where each element has these fields:
{
  "scene_description": "string",
  "dialogue": "string",
  "action_notes": "string",
  "shot_type": "wide|medium|close-up|extreme-close-up|over-the-shoulder|bird-eye|low-angle|high-angle|dutch-angle|pov",
  "duration_seconds": number,
  "image_prompt": "string"
}`;

  const response = await fetch(OPENAI_API_URL, {
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
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || `OpenRouter error: ${response.status}`
    );
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from AI");
  }

  // Parse JSON from the response, handling potential markdown code blocks
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let rawPanels: Array<{
    scene_description?: string;
    dialogue?: string;
    action_notes?: string;
    shot_type?: string;
    duration_seconds?: number;
    image_prompt?: string;
  }>;

  try {
    rawPanels = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  if (!Array.isArray(rawPanels)) {
    throw new Error("AI response is not an array");
  }

  // Validate and assign IDs/order
  const panels: StoryboardPanel[] = rawPanels.map((raw, index) => {
    const shotType = VALID_SHOT_TYPES.includes(raw.shot_type as ShotType)
      ? (raw.shot_type as ShotType)
      : "medium";

    return {
      id: crypto.randomUUID(),
      order: index,
      scene_description: raw.scene_description || "",
      dialogue: raw.dialogue || "",
      action_notes: raw.action_notes || "",
      shot_type: shotType,
      duration_seconds: Math.max(2, Math.min(10, raw.duration_seconds || 3)),
      image_url: null,
      image_prompt: raw.image_prompt || raw.scene_description || "",
    };
  });

  return panels;
}
