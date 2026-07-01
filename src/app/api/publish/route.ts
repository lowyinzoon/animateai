import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/publish — publish a work to the community gallery.
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
    const { title, cover_url, video_url } = body as {
      title?: string;
      cover_url?: string;
      video_url?: string;
    };

    if (!cover_url && !video_url) {
      return NextResponse.json(
        { error: "Nothing to publish — generate or assemble a film first" },
        { status: 400 }
      );
    }

    const author = (user.email || "creator").split("@")[0];
    const admin = createAdminClient();

    const { data: work, error } = await admin
      .from("assets")
      .insert({
        user_id: user.id,
        type: "video",
        name: title || "Untitled",
        file_url: video_url || cover_url,
        metadata: {
          kind: "published",
          published: true,
          title: title || "Untitled",
          cover_url: cover_url || null,
          video_url: video_url || null,
          author,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("Publish error:", error);
      return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: work?.id });
  } catch (error) {
    console.error("Publish error:", error);
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
