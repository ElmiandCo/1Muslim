/** Conservative full-Shahada matching for the short browser speech-recognition entrance.
 * This is a voice UX signal, NOT proof of religious identity.
 */
export type ShahadaLanguage = "ar" | "en";

const arabic = (s: string) => s.normalize("NFKD")
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
  .replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي")
  .replace(/ؤ/g, "و").replace(/ئ/g, "ي")
  .replace(/ـ/g, "").replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, " ")
  .replace(/\s+/g, " ").trim();

const english = (s: string) => s.normalize("NFKD").toLowerCase()
  .replace(/[’']/g, "").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

export function recognizeCompleteShahada(speech: string): ShahadaLanguage | null {
  if (!speech || speech.length > 12000) return null;
  const a = arabic(speech).replace(/\s/g, "");
  // Both clauses must be heard in sequence; never accept just "Allah" or "Muhammad".
  if (a.includes("اشهد") && a.includes("لاالهالاالله") &&
      a.includes("محمد") && a.includes("رسولالله") &&
      a.indexOf("لاالهالاالله") < a.indexOf("محمد")) return "ar";

  const e = english(speech);
  const oath = /\b(?:i\s+)?(?:bear\s+witness|testify|ashhadu)\b/.test(e);
  const first = /\b(?:there\s+is\s+)?no\s+(?:deity|god|one\s+worthy\s+of\s+worship)\b/.test(e)
    || /\bla\s+ilaha\b/.test(e);
  const exception = /\b(?:except|but|other\s+than)\s+(?:allah|god)\b/.test(e)
    || /\billallah\b/.test(e);
  const prophet = /\b(?:muhammad|mohammed|mohammad|muhammed|muhammadan)\b/.test(e);
  const second = /\b(?:messenger|prophet)\s+(?:of|from)\s+(?:allah|god)\b/.test(e)
    || /\brasul(?:ullah|allah)\b/.test(e);
  if (oath && first && exception && prophet && second) return "en";
  return null;
}
