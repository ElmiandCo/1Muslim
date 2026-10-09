import { redirect } from "next/navigation";

// The former Quran Studio landing page has been replaced by the unified reader.
// Keep the old URL working for bookmarks, but do not import its retired stylesheet.
export default function QuranStudioRedirect() {
  redirect("/elm-tent/quran");
}
