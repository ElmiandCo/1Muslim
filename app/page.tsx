import {redirect} from "next/navigation";

/** The public entrance is the exact Search Home used by signed-in members.
 * A server redirect avoids flashing an obsolete guest landing or auth loader.
 * The /search route owns the shared UI, search APIs and account-aware shortcuts.
 */
export default function HomePage(){
  redirect("/search");
}
