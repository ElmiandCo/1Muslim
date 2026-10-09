"use client";

import Link from "next/link";

export const AVATAR_TIERS = [
  { key: "starter", name: "Starter", minXp: 0, icon: "○", quality: "Clean foundation" },
  { key: "bronze", name: "Bronze", minXp: 500, icon: "◆", quality: "First accessories" },
  { key: "silver", name: "Silver", minXp: 10500, icon: "✦", quality: "Emerald Aura" },
  { key: "gold", name: "Gold", minXp: 25000, icon: "✧", quality: "Gold Crest" },
  { key: "elite", name: "Elite", minXp: 50000, icon: "☪", quality: "Light of Iman" },
] as const;

export const ACCESSORIES = [
  { id: "classic-badge", name: "Classic Badge", tier: "bronze", icon: "◆" },
  { id: "muslim-badge", name: "Muslim Badge", tier: "bronze", icon: "☪" },
  { id: "glow", name: "Emerald Aura", tier: "silver", icon: "✦" },
  { id: "crown", name: "Gold Crest", tier: "gold", icon: "♛" },
  { id: "light-iman", name: "Light of Iman", tier: "elite", icon: "✧" },
] as const;

export function tierForXp(xp: number) {
  return [...AVATAR_TIERS].reverse().find((tier) => xp >= tier.minXp) ?? AVATAR_TIERS[0];
}

type Props = {
  name?: string | null;
  gender?: string | null;
  avatarGender?: string | null;
  avatarPackage?: string | null;
  avatarConfig?: Record<string, unknown> | null;
  accent?: string | null;
  size?: "sm" | "md" | "lg";
  isLive?: boolean;
  profileId?: string | null;
};

export default function ProfileAvatar({
  name,
  gender,
  avatarGender,
  avatarPackage,
  avatarConfig,
  accent = "emerald",
  size = "md",
  isLive = false,
  profileId,
}: Props) {
  const config = avatarConfig ?? {};
  const selectedGender = String(config.gender ?? avatarGender ?? gender ?? "male").toLowerCase();
  const packageKey = String(config.package ?? avatarPackage ?? "starter");
  const accessoryIds = Array.isArray(config.accessories) ? config.accessories.map(String) : [];
  const accessories = ACCESSORIES.filter((item) => accessoryIds.includes(item.id));
  const isFemale = selectedGender === "female";
  const customAvatar = typeof config.adminAvatarUrl === "string" && /^https:\/\//.test(config.adminAvatarUrl) ? config.adminAvatarUrl : null;
  const avatarSrc = customAvatar || (isFemale ? "/assets/avatars/Default-women.png" : "/assets/avatars/default-male.jpg");

  const avatarContent = (
    <div className={`profileAvatar avatar-${size} accent-${accent} package-${packageKey}${isLive ? " isLive" : ""}`} aria-label={`${name ?? "Member"} avatar${isLive ? " · Live now" : ""}`}>
      <div className="avatarGlow" />
      <img className="avatarDefaultImage" src={avatarSrc} alt="" aria-hidden="true" draggable={false} />
      {isLive && <span className="liveAvatarRing" aria-hidden="true"><span>LIVE</span></span>}
      {accessories.map((item) => (
        <span key={item.id} className={`avatarAccessory accessory-${item.id}`}>{item.icon}</span>
      ))}
    </div>
  );

  if (!profileId) return avatarContent;
  return <Link href={`/profile/${profileId}`} aria-label={`Open ${name ?? "Member"} profile`} style={{display:"inline-flex",textDecoration:"none",color:"inherit"}}>{avatarContent}</Link>;
}
