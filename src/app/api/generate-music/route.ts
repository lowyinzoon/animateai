import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMusicTask, getMusicResult } from "@/lib/ai/music";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, instrumental, model } = body;
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const userKlingKey = user.user_metadata?.api_keys?.kling;
    const taskId = await createMusicTask(
      { prompt, instrumental, model },
      userKlingKey
    );

    return NextResponse.json({ success: true, task_id: taskId });
  } catch (error) {
    console.error("Music generation error:", error);
    const message = error instanceof Error ? error.message : "Music generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("task_id");
    if (!taskId) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    const userKlingKey = user.user_metadata?.api_keys?.kling;
    const result = await getMusicResult(taskId, userKlingKey);

    // Map kie.ai Suno statuses to a simple state.
    let state: "pending" | "success" | "fail" = "pending";
    if (result.audioUrl && (result.status === "SUCCESS" || result.status === "FIRST_SUCCESS")) {
      state = "success";
    } else if (/FAILED|ERROR/.test(result.status)) {
      state = "fail";
    }

    return NextResponse.json({ state, audio_url: result.audioUrl, status: result.status });
  } catch (error) {
    console.error("Music poll error:", error);
    const message = error instanceof Error ? error.message : "Failed to get music status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
