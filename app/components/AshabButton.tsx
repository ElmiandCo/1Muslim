"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

type Row = { id: string; requester_id: string; addressee_id: string; status: "pending" | "accepted" | "declined" };

export default function AshabButton({ targetId }: { targetId: string }) {
  const [me, setMe] = useState<string | null>(null);
  const [row, setRow] = useState<Row | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user || user.id === targetId) return;
    setMe(user.id);
    const { data } = await s.from("ashab_friendships")
      .select("id,requester_id,addressee_id,status")
      .or(`requester_id.eq.\${user.id},addressee_id.eq.\${user.id}`);
    const rows = (data ?? []) as Row[];
    const relation = rows.find(x =>
      (x.requester_id === user.id && x.addressee_id === targetId) ||
      (x.requester_id === targetId && x.addressee_id === user.id)
    ) ?? null;
    setRow(relation);
    setCount(rows.filter(x => x.status === "accepted" && (x.requester_id === user.id || x.addressee_id === user.id)).length);
  };

  useEffect(() => { void load(); }, [targetId]);

  const act = async () => {
    if (!me || busy || row?.status === "accepted") return;
    setBusy(true);
    const s = createClient();

    if (row?.status === "pending" && row.addressee_id === me) {
      const { error } = await s.from("ashab_friendships").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", row.id);
      if (!error) await load();
      setBusy(false);
      return;
    }

    if (row?.status === "pending") {
      setBusy(false);
      return;
    }

    if (count >= 5) {
      window.alert("You already have 5 Ashab. Remove one before adding another.");
      setBusy(false);
      return;
    }

    const { error } = await s.from("ashab_friendships").insert({ requester_id: me, addressee_id: targetId, status: "pending" });
    if (!error) await load();
    else window.alert(error.message);
    setBusy(false);
  };

  if (!me) return null;
  const label = row?.status === "accepted" ? "✓ Ashab" : row?.status === "pending" && row.addressee_id === me ? "Accept Ashab" : row?.status === "pending" ? "Ashab requested" : "＋ Add Ashab";

  return <button className={"ashabButton " + (row?.status === "accepted" ? "accepted" : "")} onClick={() => void act()} disabled={busy || row?.status === "accepted"}>
    {busy ? "Working…" : label}
    <style jsx>{`
      .ashabButton{border:1px solid #53695a;background:#dbe9c4;color:#071008;border-radius:999px;padding:10px 15px;font-size:10px;font-weight:900;cursor:pointer}
      .ashabButton.accepted{background:transparent;color:#b9cbbd;border-color:var(--line)}
      .ashabButton:disabled{opacity:.65;cursor:default}
    `}</style>
  </button>;
}
