"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import ProfileAvatar from "../components/ProfileAvatar";
import { createClient } from "../../utils/supabase/client";
import "./ashab.css";

type Profile = {
  id: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  xp_total: number;
  avatar_gender: string;
  avatar_package: string;
  avatar_config: Record<string, unknown>;
  profile_accent: string;
};
type Friendship = { id: string; requester_id: string; addressee_id: string; status: "pending" | "accepted" | "declined" };

export default function AshabPage() {
  const [me, setMe] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [incoming, setIncoming] = useState<Friendship[]>([]);
  const [outgoing, setOutgoing] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { setLoading(false); return; }
    setMe(user.id);

    const { data: rows, error } = await s.from("ashab_friendships")
      .select("id,requester_id,addressee_id,status")
      .or(\`requester_id.eq.\${user.id},addressee_id.eq.\${user.id}\`)
      .order("created_at", { ascending: false });

    if (error) { setMessage(error.message); setLoading(false); return; }
    const all = (rows ?? []) as Friendship[];
    const accepted = all.filter(x => x.status === "accepted");
    const inc = all.filter(x => x.status === "pending" && x.addressee_id === user.id);
    const out = all.filter(x => x.status === "pending" && x.requester_id === user.id);
    const ids = [...new Set(all.flatMap(x => [x.requester_id, x.addressee_id]).filter(id => id !== user.id))];

    const { data: people } = ids.length
      ? await s.from("profiles").select("id,display_name,username,bio,xp_total,avatar_gender,avatar_package,avatar_config,profile_accent").in("id", ids)
      : { data: [] as Profile[] };

    const map: Record<string, Profile> = {};
    for (const p of (people ?? []) as Profile[]) map[p.id] = p;
    setProfiles(map);
    setFriends(accepted);
    setIncoming(inc);
    setOutgoing(out);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const friendIds = useMemo(() => new Set(friends.flatMap(x => [x.requester_id, x.addressee_id]).filter(x => x !== me)), [friends, me]);

  const respond = async (row: Friendship, status: "accepted" | "declined") => {
    setMessage("");
    const s = createClient();
    const { error } = await s.from("ashab_friendships").update({ status, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) setMessage(error.message);
    else await load();
  };

  const cancel = async (row: Friendship) => {
    const s = createClient();
    const { error } = await s.from("ashab_friendships").delete().eq("id", row.id);
    if (error) setMessage(error.message);
    else await load();
  };

  const removeFriend = async (row: Friendship) => {
    if (!window.confirm("Remove this Ashab from your circle?")) return;
    await cancel(row);
  };

  if (loading) return <main><SiteNav compact/><div className="ashabShell"><p>Loading Ashab…</p></div></main>;
  if (!me) return <main><SiteNav compact/><div className="ashabShell"><section className="ashabEmpty"><h1>Build your Ashab circle.</h1><p>Sign in to add up to five close friends.</p><Link href="/auth" className="primary">Sign in</Link></section></div></main>;

  return <main className="ashabPage">
    <SiteNav />
    <div className="ashabShell">
      <header className="ashabHero">
        <div>
          <span className="eyebrow">ASHAB · أصحاب</span>
          <h1>Your circle.</h1>
          <p>Keep it intentional. 1Muslim gives every member room for <b>5 Ashab</b> — the people you choose to stay close to.</p>
        </div>
        <div className="ashabCount"><strong>{friends.length}</strong><span>/ 5 Ashab</span></div>
      </header>

      {message && <div className="ashabMessage">{message}</div>}

      {incoming.length > 0 && <section className="ashabSection">
        <div className="sectionHead"><div><span className="eyebrow">REQUESTS</span><h2>Someone wants to be Ashab.</h2></div></div>
        <div className="ashabGrid">
          {incoming.map(row => {
            const p = profiles[row.requester_id];
            if (!p) return null;
            return <article className="ashabCard" key={row.id}><ProfileAvatar name={p.display_name} gender={null} avatarGender={p.avatar_gender} avatarPackage={p.avatar_package} avatarConfig={p.avatar_config} accent={p.profile_accent}/><div className="ashabCardBody"><h3>{p.display_name || "Member"}</h3><span>@{p.username || "member"}</span><p>{p.bio || "Building a life of faith, learning and community."}</p><div className="ashabActions"><button className="primary" onClick={() => void respond(row, "accepted")} disabled={friends.length >= 5}>Accept</button><button className="ghost" onClick={() => void respond(row, "declined")}>Decline</button></div></div></article>;
          })}
        </div>
      </section>}

      <section className="ashabSection">
        <div className="sectionHead"><div><span className="eyebrow">YOUR ASHAB</span><h2>Five seats. Choose wisely.</h2></div><Link href="/find" className="ghost">Find people →</Link></div>
        {friends.length === 0 ? <div className="ashabEmpty"><h3>Your circle is open.</h3><p>Find someone you trust, open their profile and choose <b>Add Ashab</b>.</p></div> :
          <div className="ashabGrid">{friends.map(row => { const id = row.requester_id === me ? row.addressee_id : row.requester_id; const p = profiles[id]; if (!p) return null; return <article className="ashabCard" key={row.id}><ProfileAvatar name={p.display_name} gender={null} avatarGender={p.avatar_gender} avatarPackage={p.avatar_package} avatarConfig={p.avatar_config} accent={p.profile_accent}/><div className="ashabCardBody"><h3>{p.display_name || "Member"}</h3><span>@{p.username || "member"}</span><p>{p.bio || "Building a life of faith, learning and community."}</p><div className="ashabActions"><Link href={\`/profile/\${p.id}\`} className="ghost">View profile</Link><button className="dangerGhost" onClick={() => void removeFriend(row)}>Remove</button></div></div></article>; })}</div>}
      </section>

      {outgoing.length > 0 && <section className="ashabSection">
        <div className="sectionHead"><div><span className="eyebrow">PENDING</span><h2>Requests you sent.</h2></div></div>
        <div className="pendingList">{outgoing.map(row => { const p = profiles[row.addressee_id]; if (!p) return null; return <div className="pendingItem" key={row.id}><span>{p.display_name || "Member"} <small>@{p.username || "member"}</small></span><button className="ghost" onClick={() => void cancel(row)}>Cancel</button></div>; })}</div>
      </section>}

      <footer className="ashabFooter">Ashab means companions / close associates. In 1Muslim, it is the name of your intentional five-person circle.</footer>
    </div>
  </main>;
}
