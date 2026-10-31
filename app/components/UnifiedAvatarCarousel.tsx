"use client";

import { useRef, useState } from "react";
import type { UIEvent } from "react";

type AvatarOption = {
  name: string;
  url: string;
  xp: number;
  gender: string;
  category: string;
};

type Props = {
  avatars: AvatarOption[];
  xpTotal: number;
  selectedAvatar: string | null;
  savingAvatar: boolean;
  onSelect: (url: string) => void;
};

/**
 * One continuous horizontal rail for every avatar category. Category separators
 * live inside the same scroll container; only the heading above the rail changes.
 * The heading advances once the previous category's last card has scrolled past
 * the leading edge (not merely when the next category peeks into view).
 */
export default function UnifiedAvatarCarousel({
  avatars,
  xpTotal,
  selectedAvatar,
  savingAvatar,
  onSelect,
}: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("Basic");
  const categories = ["Basic", "Elemental", "Elite", "Mumins"] as const;
  const groups = categories.map((category) => ({
    category,
    items: avatars.filter((avatar) => avatar.category === category),
  })).filter((group) => group.items.length > 0 || group.category === "Mumins");

  const updateHeading = (rail: HTMLDivElement) => {
    const left = rail.getBoundingClientRect().left;
    const sections = Array.from(rail.querySelectorAll<HTMLElement>("[data-avatar-category]"));
    let next = sections[0]?.dataset.avatarCategory || "Basic";
    // Do not change the heading until the *last* avatar in the previous
    // category has passed the rail's left edge.
    for (let index = 0; index < sections.length - 1; index += 1) {
      if (sections[index].getBoundingClientRect().right <= left + 8) {
        next = sections[index + 1].dataset.avatarCategory || next;
      } else {
        break;
      }
    }
    setActiveCategory((current) => current === next ? current : next);
  };

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    updateHeading(event.currentTarget);
  };

  return (
    <section aria-label="Avatar categories" style={{ width: "100%", minWidth: 0 }}>
      <h4 aria-live="polite" style={{
        textAlign: "left", fontSize: 12, letterSpacing: 1,
        color: "#e9d09b", margin: "4px 0 8px", minHeight: 18,
      }}>
        {activeCategory}
      </h4>
      <div
        ref={railRef}
        onScroll={onScroll}
        role="region"
        aria-label="All avatars, swipe horizontally to browse categories"
        tabIndex={0}
        style={{
          display: "flex", alignItems: "stretch", gap: 12,
          width: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden",
          scrollSnapType: "x proximity", scrollPaddingInline: 4,
          touchAction: "auto", overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch", padding: "8px 4px 18px",
          boxSizing: "border-box",
        }}
      >
        {groups.map(({ category, items }, groupIndex) => (
          <div
            key={category}
            data-avatar-category={category}
            role="group"
            aria-label={category + " avatars"}
            style={{ display: "flex", flex: "0 0 auto", gap: 12, alignItems: "stretch" }}
          >
            {groupIndex > 0 && (
              <span aria-hidden="true" style={{
                width: 1, flex: "0 0 1px", alignSelf: "stretch",
                background: "rgba(230,199,126,.65)", margin: "0 2px",
              }} />
            )}
            {category === "Mumins" ? [0, 1, 2].map((index) => (
              <div
                key={index}
                aria-label="Hidden Mumin avatar slot"
                style={{
                  flex: "0 0 clamp(104px, 36vw, 142px)", width: "clamp(104px, 36vw, 142px)",
                  minHeight: 135, border: "1px solid rgba(226,192,113,.4)",
                  borderRadius: 16, display: "grid", placeContent: "center",
                  background: "rgba(0,25,22,.5)", color: "#d6c08a",
                  scrollSnapAlign: "start", textAlign: "center",
                }}
              >
                <span style={{ fontSize: 30 }}>✦</span>
                <small>Hidden · 🔒</small>
              </div>
            )) : items.map((avatar) => {
              const locked = xpTotal < avatar.xp;
              const selected = selectedAvatar === avatar.url;
              return (
                <button
                  key={avatar.url}
                  type="button"
                  disabled={savingAvatar || locked}
                  onClick={() => onSelect(avatar.url)}
                  aria-pressed={selected}
                  style={{
                    flex: "0 0 clamp(104px, 36vw, 142px)",
                    width: "clamp(104px, 36vw, 142px)",
                    minWidth: 0, border: selected ? "2px solid #f5d47a" : "1px solid rgba(221,190,116,.6)",
                    borderRadius: 16, padding: 8,
                    background: "linear-gradient(145deg,rgba(20,70,59,.26),rgba(0,21,20,.2))",
                    backdropFilter: "blur(8px)", scrollSnapAlign: "start",
                    color: "#f5e8c8", display: "grid", justifyItems: "center", gap: 5,
                    opacity: locked ? .6 : 1,
                    transform: selected ? "perspective(450px) rotateY(-5deg) scale(1.03)" : "none",
                    transition: "transform .25s ease",
                  }}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.name + " avatar"}
                    loading="lazy"
                    style={{
                      width: "100%", maxWidth: 96, height: 104,
                      objectFit: "contain", objectPosition: "center bottom",
                      borderRadius: 12, background: "transparent",
                    }}
                  />
                  <small>{avatar.name}{locked ? ` · 🔒 ${avatar.xp.toLocaleString()} XP` : ""}</small>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
