"use client";

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
  const isFemale = selectedGender === "female";
  const avatarSrc = isFemale ? "/assets/avatars/default-female.jpg" : "/assets/avatars/default-male.jpg";

  return (
    <div className={`profileAvatar avatar-${size} accent-${accent} package-${packageKey}`} aria-label={`${name ?? "Member"} avatar`}>
      <div className="avatarGlow" />
      <img className="avatarDefaultImage" src={avatarSrc} alt="" aria-hidden="true" draggable={false} />
      {accessories.map((item) => (
        <span key={item.id} className={`avatarAccessory accessory-${item.id}`}>{item.icon}</span>
      ))}
    </div>
  );
}
