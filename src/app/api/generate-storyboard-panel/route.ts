import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generateImage } from "@/lib/ai/stability";
import type { StoryboardMetadata } from "@/types";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const body = await request.json();
    const { storyboardId, panelId, prompt, shot_type, style_preset, width, height } = body;

    if (!storyboardId || !panelId) {
      return NextResponse.json(
        { error: "Storyboard ID and panel ID are required" },
        { status: 400 }
      );
    }

    // Load storyboard
    const { data: storyboard, error: fetchError } = await admin
      .from("assets")
      .select("*")
      .eq("id", storyboardId)
      .eq("user_id", user.id)
      .eq("type", "storyboard")
      .single();

    if (fetchError || !storyboard) {
      return NextResponse.json(
        { error: "Storyboard not found" },
        { status: 404 }
      );
    }

    const meta = storyboard.metadata as unknown as StoryboardMetadata;
    const panelIndex = meta.panels.findIndex((p) => p.id === panelId);

    if (panelIndex === -1) {
      return NextResponse.json(
        { error: "Panel not found" },
        { status: 404 }
      );
    }

    const panel = meta.panels[panelIndex];

    // Build enhanced prompt
    const styleLabel = (style_preset || meta.style_preset || "digital-art").replace(/-/g, " ");
    const panelPrompt = prompt || panel.image_prompt || panel.scene_description;
    const shotLabel = shot_type || panel.shot_type || "medium";
    const enhancedPrompt = `${styleLabel} style: ${panelPrompt}. Shot type: ${shotLabel} shot. ${panel.action_notes || ""}`.trim();

    // Generate image
    const imageBuffer = await generateImage({
      prompt: enhancedPrompt,
      width: width || 1536,
      height: height || 1024,
    });

    // Upload to storage
    const fileName = `${user.id}/storyboards/${Date.now()}.png`;
    const { error: uploadError } = await admin.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, { contentType: "image/png" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to save image" },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    // Update panel's image_url in metadata
    const updatedPanels = [...meta.panels];
    updatedPanels[panelIndex] = {
      ...updatedPanels[panelIndex],
      image_url: urlData.publicUrl,
      image_prompt: panelPrompt,
    };

    const updatedMeta = {
      ...meta,
      panels: updatedPanels,
    };

    const { error: dbError } = await admin
      .from("assets")
      .update({
        metadata: updatedMeta as unknown as Record<string, unknown>,
      })
      .eq("id", storyboardId);

    if (dbError) {
      console.error("DB error:", dbError);
    }

    return NextResponse.json({
      success: true,
      image_url: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Panel image generation error:", error);
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
