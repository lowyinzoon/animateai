import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generateImage } from "@/lib/ai/stability";

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
    const { prompt, negative_prompt, width, height, style_preset } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Generate image via OpenRouter
    const userOpenrouterKey = user.user_metadata?.api_keys?.openrouter;
    const imageBuffer = await generateImage({
      prompt,
      negative_prompt,
      width: width || 1024,
      height: height || 1024,
      style_preset,
    }, userOpenrouterKey);

    // Use admin client for storage/DB (bypasses RLS)
    const admin = createAdminClient();

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.png`;
    const { error: uploadError } = await admin.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
    }

    const { data: urlData } = admin.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    // Save asset record
    const { data: asset, error: dbError } = await admin
      .from("assets")
      .insert({
        user_id: user.id,
        type: "image",
        name: prompt.substring(0, 100),
        prompt,
        file_url: urlData.publicUrl,
        metadata: { negative_prompt, width, height, style_preset },
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
    }

    return NextResponse.json({
      success: true,
      image_url: urlData.publicUrl,
      asset_id: asset?.id,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const message = error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
