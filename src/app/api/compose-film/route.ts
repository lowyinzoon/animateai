import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function downloadTo(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download clip (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

export async function POST(request: Request) {
  let workDir: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { video_urls, audio_url, title } = body as {
      video_urls?: string[];
      audio_url?: string;
      title?: string;
    };

    const clips = (video_urls ?? []).filter((u) => typeof u === "string" && u);
    if (clips.length === 0) {
      return NextResponse.json({ error: "No shot clips to assemble" }, { status: 400 });
    }

    workDir = await mkdtemp(path.join(tmpdir(), "film-"));

    // 1) Download every shot clip in order.
    const localClips: string[] = [];
    for (let i = 0; i < clips.length; i++) {
      const dest = path.join(workDir, `clip-${String(i).padStart(3, "0")}.mp4`);
      await downloadTo(clips[i], dest);
      localClips.push(dest);
    }

    // 2) Concatenate (re-encode for robustness against slight param drift).
    const listFile = path.join(workDir, "list.txt");
    await writeFile(
      listFile,
      localClips.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n")
    );

    const stitched = path.join(workDir, "stitched.mp4");
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-c:a", "aac",
        "-ar", "44100",
        "-movflags", "+faststart",
        stitched,
      ],
      { maxBuffer: 1024 * 1024 * 64 }
    );

    // 3) Optional: lay a music track under the film.
    let finalFile = stitched;
    if (audio_url) {
      const audioLocal = path.join(workDir, "music.mp3");
      await downloadTo(audio_url, audioLocal);
      const mixed = path.join(workDir, "final.mp4");
      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-i", stitched,
          "-i", audioLocal,
          "-filter_complex",
          // keep original shot audio but duck it under the music bed
          "[0:a]volume=1.0[a0];[1:a]volume=0.35[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]",
          "-map", "0:v",
          "-map", "[aout]",
          "-c:v", "copy",
          "-c:a", "aac",
          "-shortest",
          "-movflags", "+faststart",
          mixed,
        ],
        { maxBuffer: 1024 * 1024 * 64 }
      );
      finalFile = mixed;
    }

    // 4) Upload the finished film to public storage.
    const admin = createAdminClient();
    const fileBuf = await readFile(finalFile);
    const fileName = `${user.id}/films/${Date.now()}.mp4`;
    const { error: uploadError } = await admin.storage
      .from("generated-images")
      .upload(fileName, fileBuf, { contentType: "video/mp4" });
    if (uploadError) {
      console.error("Film upload error:", uploadError);
      return NextResponse.json({ error: "Failed to save film" }, { status: 500 });
    }
    const { data: urlData } = admin.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    // 5) Record the asset.
    const { data: asset } = await admin
      .from("assets")
      .insert({
        user_id: user.id,
        type: "video",
        name: title || "Assembled film",
        prompt: null,
        file_url: urlData.publicUrl,
        metadata: { kind: "film", shots: clips.length, has_music: !!audio_url },
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      film_url: urlData.publicUrl,
      asset_id: asset?.id,
    });
  } catch (error) {
    console.error("Film composition error:", error);
    const message = error instanceof Error ? error.message : "Film composition failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
