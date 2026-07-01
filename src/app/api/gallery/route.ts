import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/gallery — community feed of published works (public, read-only).
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("assets")
      .select("id, name, file_url, metadata, created_at")
      .filter("metadata->>published", "eq", "true")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("Gallery load error:", error);
      return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
    }

    const works = (data || []).map((row) => {
      const m = (row.metadata || {}) as Record<string, unknown>;
      return {
        id: row.id,
        title: (m.title as string) || row.name || "Untitled",
        cover_url: (m.cover_url as string) || null,
        video_url: (m.video_url as string) || null,
        author: (m.author as string) || "creator",
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ works });
  } catch (error) {
    console.error("Gallery error:", error);
    const message = error instanceof Error ? error.message : "Failed to load gallery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
