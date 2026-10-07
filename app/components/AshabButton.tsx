"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

export default function AshabButton({ targetId }: { targetId: string }) {
  const [me, setMe] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user || user.id === targetId) return;
    setMe(user.id);
    const { data } = await s.from("profile_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", targetId)
      .maybeSingle();
    setFollowing(!!data);
  };

  useEffect(() => { void load(); }, [targetId]);

  const toggleFollow = async () => {
    if (!me || busy) return;
    setBusy(true);
    const s = createClient();

    if (following) {
      const { error } = await s.from("profile_follows")
        .delete()
        .eq("follower_id", me)
        .eq("following_id", targetId);
      if (!error) setFollowing(false);
      else window.alert(error.message);
    } else {
      const { error } = await s.from("profile_follows")
        .insert({ follower_id: me, following_id: targetId });
      if (!error) setFollowing(true);
      else window.alert(error.message);
    }

    setBusy(false);
  };

  if (!me) return null;

  return <button
    className={following ? "ashabButton following" : "ashabButton"}
    onClick={() => void toggleFollow()}
    disabled={busy}
    aria-pressed={following}
  >
    {busy ? "Working…" : following ? "Unfollow" : "Follow"}
    <style jsx>{`
      .ashabButton{border:1px solid #53695a;background:#dbe9c4;color:#071008;border-radius:999px;padding:10px 15px;font-size:10px;font-weight:900;cursor:pointer}
      .ashabButton.following{background:transparent;color:#b9cbbd;border-color:var(--line)}
      .ashabButton:disabled{opacity:.65;cursor:default}
    `}</style>
  </button>;
}
