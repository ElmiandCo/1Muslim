import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const runtime = "nodejs";
const MAX_MESSAGE = 1500;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Sign in to use HudHud." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: "Message must be 1–1500 characters." }, { status: 400 });
    }

    // No API credentials ever reach the browser. This endpoint is disabled until configured.
    const apiKey = process.env.ONE_MUSLIM_OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "HudHud AI is not enabled yet." }, { status: 503 });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.ONE_MUSLIM_OPENAI_MODEL || "gpt-4.1-mini",
        instructions: "You are HudHud, the helpful AI guide inside 1Muslim. Be respectful, concise, and clear. You are not a scholar or a religious authority. For religious questions, distinguish established citations from uncertainty, and encourage checking the Qur'an and authentic sources. Never claim access to private account information or app actions unless explicitly provided.",
        input: message,
        max_output_tokens: 400,
        store: false
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: "HudHud AI is temporarily unavailable." }, { status: 502 });
    const reply = (result.output || []).flatMap((item: { content?: Array<{ type?: string; text?: string }> }) =>
      (item.content || []).filter(part => part.type === "output_text").map(part => part.text || "")
    ).join("\n").trim();
    if (!reply) return NextResponse.json({ error: "No response received." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Unable to reach HudHud AI." }, { status: 500 });
  }
}
