import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planAnimation, composePanelPrompt } from "@/lib/ai/orchestrator";

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
    const { idea, style_preset, panel_count } = body;

    if (!idea || typeof idea !== "string" || !idea.trim()) {
      return NextResponse.json({ error: "An idea prompt is required" }, { status: 400 });
    }

    const userOpenrouterKey = user.user_metadata?.api_keys?.openrouter;
    const userLlmModel = user.user_metadata?.api_keys?.llm_model;

    const plan = await planAnimation(
      { idea: idea.trim(), style_preset, panel_count },
      userOpenrouterKey,
      userLlmModel
    );

    // Attach the character-locked, shot-aware final prompt for each panel so the
    // client can generate images without importing the server-only orchestrator module.
    const panels = plan.panels.map((panel) => ({
      ...panel,
      final_prompt: composePanelPrompt(plan, panel),
    }));

    return NextResponse.json({ success: true, plan: { ...plan, panels } });
  } catch (error) {
    console.error("Orchestration error:", error);
    const message = error instanceof Error ? error.message : "Orchestration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
