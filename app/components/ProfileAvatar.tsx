"use client";

export const AVATAR_TIERS = [
  { key: "starter", name: "Starter", minXp: 0, icon: "○", quality: "Clean foundation" },
  { key: "bronze", name: "Bronze", minXp: 500, icon: "◆", quality: "First accessories" },
  { key: "silver", name: "Silver", minXp: 1500, icon: "✦", quality: "Premium details" },
  { key: "gold", name: "Gold", minXp: 3000, icon: "✧", quality: "Elite customization" },
  { key: "elite", name: "Elite", minXp: 6000, icon: "☪", quality: "Full collection" },
] as const;

export const ACCESSORIES = [
  { id: "cap", name: "Classic Cap", tier: "bronze", icon: "🧢" },
  { id: "scarf", name: "Travel Scarf", tier: "bronze", icon: "🧣" },
  { id: "glow", name: "Emerald Aura", tier: "silver", icon: "✦" },
  { id: "crown", name: "Gold Crest", tier: "gold", icon: "♛" },
  { id: "halo", name: "Light Ring", tier: "gold", icon: "◉" },
  { id: "royal", name: "Royal Trim", tier: "elite", icon: "✧" },
  { id: "star", name: "Star Badge", tier: "elite", icon: "★" },
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
};

export default function ProfileAvatar({
  name,
  gender,
  avatarGender,
  avatarPackage,
  avatarConfig,
  accent = "emerald",
  size = "md",
}: Props) {
  const config = avatarConfig ?? {};
  const selectedGender = String(config.gender ?? avatarGender ?? gender ?? "male").toLowerCase();
  const packageKey = String(config.package ?? avatarPackage ?? "starter");
  const accessoryIds = Array.isArray(config.accessories) ? config.accessories.map(String) : [];
  const accessories = ACCESSORIES.filter((item) => accessoryIds.includes(item.id));
  const initial = (name?.trim()?.[0] ?? "1").toUpperCase();

  return (
    <div className={`profileAvatar avatar-${size} accent-${accent} package-${packageKey}`} aria-label={`${name ?? "Member"} avatar`}>
      <div className="avatarGlow" />
      <div className="avatarHead">{selectedGender === "female" ? "◉" : "●"}</div>
      <div className="avatarBody"><span>{initial}</span></div>
      {accessories.map((item) => <span key={item.id} className={`avatarAccessory accessory-${item.id}`}>{item.icon}</span>)}
    </div>
  );
}
