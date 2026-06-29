import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generateImage } from "@/lib/ai/stability";
import type { SceneMetadata } from "@/types";

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
    const { sceneId, prompt, width, height } = body;

    if (!sceneId || !prompt) {
      return NextResponse.json(
        { error: "Scene ID and prompt are required" },
        { status: 400 }
      );
    }

    // Load scene
    const { data: scene, error: fetchError } = await admin
      .from("assets")
      .select("*")
      .eq("id", sceneId)
      .eq("user_id", user.id)
      .eq("type", "scene")
      .single();

    if (fetchError || !scene) {
      return NextResponse.json(
        { error: "Scene not found" },
        { status: 404 }
      );
    }

    const meta = scene.metadata as unknown as SceneMetadata;

    // Build enhanced prompt from scene metadata
    const parts: string[] = [];

    if (meta?.style_preset) {
      parts.push(`${meta.style_preset.replace(/-/g, " ")} style`);
    }

    if (meta?.environment) {
      parts.push(`${meta.environment} environment`);
    }

    if (meta?.time_of_day) {
      parts.push(`${meta.time_of_day} time of day`);
    }

    if (meta?.weather && meta.weather !== "clear") {
      parts.push(`${meta.weather} weather`);
    }

    if (meta?.mood) {
      parts.push(`${meta.mood} mood`);
    }

    if (meta?.lighting) {
      parts.push(`${meta.lighting} lighting`);
    }

    if (meta?.color_palette) {
      parts.push(`${meta.color_palette} color palette`);
    }

    const settingsPrefix = parts.length > 0 ? `${parts.join(", ")}. ` : "";
    const enhancedPrompt = `${settingsPrefix}${prompt}. ${meta?.additional_details || ""}`.trim();

    // Generate image
    const userOpenrouterKey = user.user_metadata?.api_keys?.openrouter;
    const imageBuffer = await generateImage({
      prompt: enhancedPrompt,
      width: width || 1024,
      height: height || 1024,
    }, userOpenrouterKey);

    // Upload to storage
    const fileName = `${user.id}/scenes/${Date.now()}.png`;
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

    // Append to scene's generated_images array
    const newImage = {
      url: urlData.publicUrl,
      prompt: prompt,
      createdAt: new Date().toISOString(),
    };

    const updatedImages = [...(meta?.generated_images || []), newImage];
    const updatedMeta = {
      ...meta,
      generated_images: updatedImages,
    };

    const { error: dbError } = await admin
      .from("assets")
      .update({
        metadata: updatedMeta as unknown as Record<string, unknown>,
      })
      .eq("id", sceneId);

    if (dbError) {
      console.error("DB error:", dbError);
    }

    return NextResponse.json({
      success: true,
      image_url: urlData.publicUrl,
      image: newImage,
    });
  } catch (error) {
    console.error("Scene image generation error:", error);
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
