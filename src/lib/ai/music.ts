// Sound Director — generates a background score via kie.ai's Suno API.
// Uses the same kie.ai account/key as video (user_metadata.api_keys.kling).

const KIE_GENERATE = "https://api.kie.ai/api/v1/generate";
const KIE_RECORD = "https://api.kie.ai/api/v1/generate/record-info";

interface MusicParams {
  prompt: string;
  instrumental?: boolean;
  model?: string;
  callBackUrl?: string;
}

interface MusicResult {
  status: string;
  audioUrl?: string;
}

export async function createMusicTask(params: MusicParams, overrideApiKey?: string): Promise<string> {
  const apiKey = overrideApiKey || process.env.KLING_API_KEY;
  if (!apiKey) {
    throw new Error("KIE AI API key is not configured");
  }

  const response = await fetch(KIE_GENERATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      customMode: false,
      instrumental: params.instrumental ?? true,
      model: params.model || "V4_5",
      // Required by the API even when polling; we don't rely on the callback.
      callBackUrl: params.callBackUrl || "https://oiioii.local/callback",
    }),
  });

  if (!response.ok) {
    let message = `KIE music error: ${response.status}`;
    try {
      const error = await response.json();
      message = error.msg || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();
  const taskId = data.data?.taskId;
  if (!taskId) {
    throw new Error(data.msg || "Failed to create music task");
  }
  return taskId;
}

export async function getMusicResult(taskId: string, overrideApiKey?: string): Promise<MusicResult> {
  const apiKey = overrideApiKey || process.env.KLING_API_KEY;
  if (!apiKey) {
    throw new Error("KIE AI API key is not configured");
  }

  const response = await fetch(`${KIE_RECORD}?taskId=${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get music status: ${response.status}`);
  }

  const data = await response.json();
  const task = data.data;
  const audioUrl = task?.response?.sunoData?.[0]?.audioUrl;

  return {
    status: task?.status || "PENDING",
    audioUrl: audioUrl || undefined,
  };
}
