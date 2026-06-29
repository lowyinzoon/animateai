import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createVideoTask, getTaskResult } from "@/lib/ai/kling";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, image_url, duration, aspect_ratio, resolution } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const userKlingKey = user.user_metadata?.api_keys?.kling;
    const taskId = await createVideoTask({
      prompt,
      image_url,
      duration: duration || 5,
      aspect_ratio: aspect_ratio || "16:9",
      resolution: resolution || "720p",
    }, userKlingKey);

    const admin = createAdminClient();

    // Save asset record with pending state
    const { data: asset } = await admin
      .from("assets")
      .insert({
        user_id: user.id,
        type: "video",
        name: prompt.substring(0, 100),
        prompt,
        metadata: { taskId, duration, aspect_ratio, resolution, state: "generating" },
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      task_id: taskId,
      asset_id: asset?.id,
    });
  } catch (error) {
    console.error("Video generation error:", error);
    const message = error instanceof Error ? error.message : "Video generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Poll for task status
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("task_id");
    const assetId = searchParams.get("asset_id");

    if (!taskId) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    const userKlingKey = user.user_metadata?.api_keys?.kling;
    const result = await getTaskResult(taskId, userKlingKey);
    const admin = createAdminClient();

    // Update asset record when complete
    if (result.state === "success" && result.videoUrl && assetId) {
      await admin
        .from("assets")
        .update({
          file_url: result.videoUrl,
          metadata: { taskId, state: "success" },
        })
        .eq("id", assetId)
        .eq("user_id", user.id);
    }

    if (result.state === "fail" && assetId) {
      await admin
        .from("assets")
        .update({
          metadata: { taskId, state: "fail", failMsg: result.failMsg },
        })
        .eq("id", assetId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      state: result.state,
      video_url: result.videoUrl,
      progress: result.progress,
      fail_msg: result.failMsg,
    });
  } catch (error) {
    console.error("Task poll error:", error);
    const message = error instanceof Error ? error.message : "Failed to get task status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
