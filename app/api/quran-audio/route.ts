import { NextRequest, NextResponse } from "next/server";

// Self-hosted Quran audio manifest. Configure QURAN_AUDIO_PUBLIC_BASE_URL after
// importing recordings into an R2 bucket with redistribution permission.
// Do not expose R2 credentials to browsers.
const RECITERS = new Set(["ar.alafasy", "ar.abdurrahmaansudais", "ar.husary"]);
const VERSE_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
export async function GET(request: NextRequest) {
  const reciter = request.nextUrl.searchParams.get("reciter") || "ar.alafasy";
  const chapter = Number(request.nextUrl.searchParams.get("chapter"));
  const verse = Number(request.nextUrl.searchParams.get("verse"));
  if (!RECITERS.has(reciter) || !Number.isInteger(chapter) || chapter < 1 || chapter > 114 ||
      !Number.isInteger(verse) || verse < 1 || verse > VERSE_COUNTS[chapter - 1]) {
    return NextResponse.json({ error: "Invalid reciter or verse" }, { status: 400 });
  }
  const rawBase = process.env.QURAN_AUDIO_PUBLIC_BASE_URL?.trim() || ""; const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  if (!base.startsWith("https://")) {
    return NextResponse.json({ available: false, reason: "Self-hosted audio not configured" }, { status: 404 });
  }
  // Immutable paths: an approved recording is never silently replaced.
  const url = `${base}/v1/${reciter}/${chapter}/${verse}.mp3`;
  return NextResponse.json({ available: true, source: "1muslim-r2", reciter, chapter, verse, url },
    { headers: { "Cache-Control": "public, max-age=300" } });
}
