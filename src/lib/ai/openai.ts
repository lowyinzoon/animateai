const OPENAI_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ScriptParams {
  prompt: string;
  genre: string;
  tone?: string;
  length?: "short" | "medium" | "long";
}

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: "Keep the script concise, around 500-800 words.",
  medium: "Write a medium-length script, around 1500-2000 words.",
  long: "Write a detailed script, around 3000-4000 words.",
};

export async function generateScript(params: ScriptParams, overrideApiKey?: string, overrideModel?: string): Promise<ReadableStream> {
  const apiKey = overrideApiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const systemPrompt = `You are a professional screenwriter and storytelling expert. You write compelling scripts for animation and film production.
Always format your scripts professionally with:
- Scene headings (INT./EXT. LOCATION - TIME)
- Character names in CAPS when first introduced
- Action lines and dialogue properly formatted
- Clear scene transitions`;

  const userPrompt = `Write a ${params.genre} script based on the following concept:

${params.prompt}

${params.tone ? `Tone: ${params.tone}` : ""}
${params.length ? LENGTH_INSTRUCTIONS[params.length] : LENGTH_INSTRUCTIONS.medium}`;

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
      stream: true,
      temperature: 0.8,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI error: ${response.status}`);
  }

  return response.body!;
}
