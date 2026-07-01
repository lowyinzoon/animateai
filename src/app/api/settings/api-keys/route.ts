import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = user.user_metadata?.api_keys || {};

    return NextResponse.json({
      openrouter: !!apiKeys.openrouter,
      openai: !!apiKeys.openai,
      kling: !!apiKeys.kling,
    });
  } catch (error) {
    console.error("API keys status error:", error);
    return NextResponse.json(
      { error: "Failed to get API keys status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key || !["openrouter", "openai", "kling"].includes(key)) {
      return NextResponse.json(
        { error: "Invalid key parameter" },
        { status: 400 }
      );
    }

    const currentKeys = user.user_metadata?.api_keys || {};
    const updatedKeys = { ...currentKeys, [key]: "" };

    const { error } = await supabase.auth.updateUser({
      data: { api_keys: updatedKeys },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API key delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
