import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const runtime = "nodejs";
const MAX_MESSAGE = 1500;
// Reserve a conservative ceiling for each request; shared budget is $5 total.
const RESERVE_USD = 0.003;
const INPUT_PER_MILLION = 0.40;
const OUTPUT_PER_MILLION = 1.60;

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

    const feature = ["chat","quran","lesson","vision"].includes(body?.feature) ? body.feature : "chat";
    const model = "gpt-4.1-mini"; // Pricing calculation below is specific to this model.
    const { data: reservation, error: budgetError } = await supabase.rpc("hudhud_ai_reserve", {
      p_feature: feature, p_model: model, p_reserve_usd: RESERVE_USD
    });
    if (budgetError || !reservation) {
      const blocked = budgetError?.message?.includes("HUDHUD_BUDGET_REACHED");
      return NextResponse.json({
        error: blocked ? "HudHud's shared $5 AI credit allowance has been reached. Please try again later." : "HudHud usage protection is not ready.",
        code: blocked ? "BUDGET_REACHED" : "METERING_UNAVAILABLE"
      }, { status: blocked ? 429 : 503 });
    }
    let successful = false;
    let inputTokens = 0, outputTokens = 0, cost = 0;
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
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
      inputTokens = Number(result.usage?.input_tokens || 0);
      outputTokens = Number(result.usage?.output_tokens || 0);
      cost = (inputTokens * INPUT_PER_MILLION + outputTokens * OUTPUT_PER_MILLION) / 1_000_000;
      const reply = (result.output || []).flatMap((item: { content?: Array<{ type?: string; text?: string }> }) =>
        (item.content || []).filter(part => part.type === "output_text").map(part => part.text || "")
      ).join("\\n").trim();
      if (!reply) return NextResponse.json({ error: "No response received." }, { status: 502 });
      successful = true;
      return NextResponse.json({ reply });
    } finally {
      // On a failed API call the reservation is released. On success, actual usage is recorded.
      const { error: meterError } = await supabase.rpc("hudhud_ai_finalize", {
        p_id: reservation, p_input_tokens: inputTokens, p_output_tokens: outputTokens,
        p_actual_usd: cost, p_success: successful
      });
      if (meterError) console.error("HudHud AI usage finalization failed", meterError.message);
    }
  } catch {
    return NextResponse.json({ error: "Unable to reach HudHud AI." }, { status: 500 });
  }
}
