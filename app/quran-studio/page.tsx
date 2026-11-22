import {redirect} from "next/navigation";

// The cinematic Studio is retired. Both old Studio URLs now resolve
// directly to the supported Quran Library without exposing the old UI.
export default function RetiredStudioAlias() {
 redirect("/quran-library");
}
