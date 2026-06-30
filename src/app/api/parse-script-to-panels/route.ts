import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseScriptToPanels } from "@/lib/ai/storyboard";

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
    const { script_content } = body;

    if (!script_content) {
      return NextResponse.json(
        { error: "Script content is required" },
        { status: 400 }
      );
    }

    const userOpenrouterKey = user.user_metadata?.api_keys?.openrouter;
    const userLlmModel = user.user_metadata?.api_keys?.llm_model;
    const panels = await parseScriptToPanels(script_content, userOpenrouterKey, userLlmModel);

    return NextResponse.json({
      success: true,
      panels,
    });
  } catch (error) {
    console.error("Script parsing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse script";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
