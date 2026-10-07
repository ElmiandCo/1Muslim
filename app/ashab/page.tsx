"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import ProfileAvatar from "../components/ProfileAvatar";
import AshabButton from "../components/AshabButton";
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
type Stats = { followers: number; following: number; ashab: number };

export default function AshabPage() {
  const [me, setMe] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ followers: 0, following: 0, ashab: 0 });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [liveIds, setLiveIds] = useState<Set<string>>(new Set());

  const load = async () => {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { setLoading(false); return; }
    setMe(user.id);

    const [{ data: statsData, error: statsError }, { data: ashabRows, error: ashabError }] = await Promise.all([
      s.rpc("get_profile_relationship_stats", { p_profile_id: user.id }),
      s.rpc("get_ashab_ids", { p_profile_id: user.id }),
    ]);

    if (statsError || ashabError) {
      setMessage((statsError || ashabError)?.message || "Unable to load your Ashab.");
      setLoading(false);
      return;
    }

    if (statsData?.[0]) {
      setStats({
        followers: Number(statsData[0].followers) || 0,
        following: Number(statsData[0].following) || 0,
        ashab: Number(statsData[0].ashab) || 0,
      });
    }

    const ids = (ashabRows ?? []).map((row: { user_id: string }) => row.user_id);
    if (ids.length) {
      const [{ data: people }, { data: liveRows }] = await Promise.all([
        s.from("profiles").select("id,display_name,username,bio,xp_total,avatar_gender,avatar_package,avatar_config,profile_accent").in("id", ids),
        s.from("live_streams").select("host_id").eq("status", "live").in("host_id", ids),
      ]);
      setProfiles((people ?? []) as Profile[]);
      setLiveIds(new Set((liveRows ?? []).map(row => row.host_id)));
    } else {
      setProfiles([]);
      setLiveIds(new Set());
    }

    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <main><SiteNav compact/><div className="ashabShell"><p>Loading Ashab…</p></div></main>;
  if (!me) return <main><SiteNav compact/><div className="ashabShell"><section className="ashabEmpty"><h1>Build your Ashab circle.</h1><p>Sign in to see the people who follow you back.</p><Link href="/auth" className="primary">Sign in</Link></section></div></main>;

  return <main className="ashabPage">
    <SiteNav />
    <div className="ashabShell">
      <header className="ashabHero">
        <div>
          <span className="eyebrow">ASHAB · أصحاب</span>
          <h1>Your circle.</h1>
          <p>Ashab are the people where the relationship goes both ways — <b>you follow them and they follow you.</b> There is no five-person limit.</p>
        </div>
        <div className="ashabCount"><strong>{stats.ashab.toLocaleString()}</strong><span>Ashab</span></div>
      </header>

      <section className="relationshipOverview">
        <Link href="#followers"><strong>{stats.followers.toLocaleString()}</strong><span>Followers</span></Link>
        <Link href="#following"><strong>{stats.following.toLocaleString()}</strong><span>Following</span></Link>
        <Link href="#ashab"><strong>{stats.ashab.toLocaleString()}</strong><span>Ashab</span></Link>
      </section>

      {message && <div className="ashabMessage">{message}</div>}

      <section className="ashabSection" id="ashab">
        <div className="sectionHead">
          <div><span className="eyebrow">MUTUAL FOLLOWING</span><h2>Your Ashab.</h2></div>
          <Link href="/find" className="ghost">Find people →</Link>
        </div>

        {profiles.length === 0 ? (
          <div className="ashabEmpty">
            <h3>No Ashab yet.</h3>
            <p>Follow people you trust. When they follow you back, they automatically become Ashab.</p>
            <Link href="/find" className="primary">Find people</Link>
          </div>
        ) : (
          <div className="ashabGrid">
            {profiles.map(p => (
              <article className="ashabCard" key={p.id}>
                <ProfileAvatar name={p.display_name} gender={null} avatarGender={p.avatar_gender} avatarPackage={p.avatar_package} avatarConfig={p.avatar_config} accent={p.profile_accent} isLive={liveIds.has(p.id)}/>
                <div className="ashabCardBody">
                  <h3>{p.display_name || "Member"}</h3>
                  <span>@{p.username || "member"}</span>
                  <p>{p.bio || "Building a life of faith, learning and community."}</p>
                  <div className="ashabActions">
                    <Link href={`/profile/${p.id}`} className="ghost">View profile</Link>
                    <AshabButton targetId={p.id}/>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ashabSection" id="followers">
        <div className="sectionHead"><div><span className="eyebrow">FOLLOWERS</span><h2>{stats.followers.toLocaleString()} people follow you.</h2></div></div>
        <p className="muted">Your follower count includes everyone who follows you. Ashab is the subset that you follow back.</p>
      </section>

      <section className="ashabSection" id="following">
        <div className="sectionHead"><div><span className="eyebrow">FOLLOWING</span><h2>You follow {stats.following.toLocaleString()} people.</h2></div></div>
        <p className="muted">Following is independent of Ashab. When a person follows you back, they move into your Ashab count automatically.</p>
      </section>

      <footer className="ashabFooter">Ashab means companions / close associates. On 1Muslim, Ashab is simply the common users in your Followers and Following relationships.</footer>
    </div>
  </main>;
}
