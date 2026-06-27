import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateImage } from "@/lib/ai/stability";
import type { CharacterMetadata } from "@/types";

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
    const { characterId, prompt, category, label, width, height } = body;

    if (!characterId || !prompt) {
      return NextResponse.json(
        { error: "Character ID and prompt are required" },
        { status: 400 }
      );
    }

    // Load character
    const { data: character, error: fetchError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", characterId)
      .eq("user_id", user.id)
      .eq("type", "character")
      .single();

    if (fetchError || !character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const meta = character.metadata as unknown as CharacterMetadata;

    if (!meta?.appearance_prompt) {
      return NextResponse.json(
        { error: "Character needs an appearance description" },
        { status: 400 }
      );
    }

    // Build consistency-enhanced prompt
    const styleLabel = meta.style_preset
      ? meta.style_preset.replace(/-/g, " ")
      : "digital art";
    const enhancedPrompt = `${styleLabel} style: ${meta.appearance_prompt}. ${prompt}. Maintain exact character appearance, proportions, and design details.`;

    // Generate image
    const imageBuffer = await generateImage({
      prompt: enhancedPrompt,
      width: width || 1024,
      height: height || 1024,
    });

    // Upload to storage
    const fileName = `${user.id}/characters/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, { contentType: "image/png" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to save image" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    // Append to character's generatedImages array
    const newImage = {
      url: urlData.publicUrl,
      prompt: prompt,
      category: category || "custom",
      label: label || prompt.substring(0, 50),
      createdAt: new Date().toISOString(),
    };

    const updatedImages = [...(meta.generatedImages || []), newImage];
    const updatedMeta = {
      ...meta,
      generatedImages: updatedImages,
    };

    const { error: dbError } = await supabase
      .from("assets")
      .update({
        metadata: updatedMeta as unknown as Record<string, unknown>,
      })
      .eq("id", characterId);

    if (dbError) {
      console.error("DB error:", dbError);
    }

    return NextResponse.json({
      success: true,
      image_url: urlData.publicUrl,
      image: newImage,
    });
  } catch (error) {
    console.error("Character image generation error:", error);
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
