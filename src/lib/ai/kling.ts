const KIE_API_BASE = "https://api.kie.ai/api/v1/jobs";

interface VideoParams {
  prompt: string;
  image_url?: string;
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
}

interface TaskResult {
  taskId: string;
  state: string;
  videoUrl?: string;
  progress?: number;
  failMsg?: string;
}

export async function createVideoTask(params: VideoParams, overrideApiKey?: string): Promise<string> {
  const apiKey = overrideApiKey || process.env.KLING_API_KEY;
  if (!apiKey) {
    throw new Error("KIE AI API key is not configured");
  }

  const model = params.image_url
    ? "bytedance/seedance-2"
    : "bytedance/seedance-2";

  const input: Record<string, unknown> = {
    prompt: params.prompt,
    duration: params.duration || 5,
    aspect_ratio: params.aspect_ratio || "16:9",
    resolution: params.resolution || "720p",
    generate_audio: true,
    nsfw_checker: true,
  };

  if (params.image_url) {
    input.first_frame_url = params.image_url;
  }

  const response = await fetch(`${KIE_API_BASE}/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input }),
  });

  if (!response.ok) {
    let message = `KIE AI error: ${response.status}`;
    try {
      const error = await response.json();
      message = error.msg || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();
  if (!data.data?.taskId) {
    throw new Error(data.msg || "Failed to create video task");
  }

  return data.data.taskId;
}

export async function getTaskResult(taskId: string, overrideApiKey?: string): Promise<TaskResult> {
  const apiKey = overrideApiKey || process.env.KLING_API_KEY;
  if (!apiKey) {
    throw new Error("KIE AI API key is not configured");
  }

  const response = await fetch(
    `${KIE_API_BASE}/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get task status: ${response.status}`);
  }

  const data = await response.json();
  const task = data.data;

  const result: TaskResult = {
    taskId: task.taskId,
    state: task.state,
    progress: task.progress,
    failMsg: task.failMsg,
  };

  if (task.state === "success" && task.resultJson) {
    try {
      const resultData = JSON.parse(task.resultJson);
      if (resultData.resultUrls?.length > 0) {
        result.videoUrl = resultData.resultUrls[0];
      }
    } catch {}
  }

  return result;
}
