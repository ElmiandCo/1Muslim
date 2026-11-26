"use client";

import { useEffect, type RefObject } from "react";

// Premium pointer proximity: only interactive Search Home/Results surfaces, never layout.
// Keep this list explicit to avoid pulling unrelated embeds, overlays, or page furniture.
const MAGNETIC_TARGETS = [
  ".dsHomeUtilities .dsUtilityButton",
  ".dsHomeUtilities .dsResultsBrand",
  ".dsHomeMode .dsSearchForm",
  ".dsHomeMode .dsHudDock.isDocked",
  ".dsHomeMode .dsCreatorRow",
  ".dsHomeMode .dsExploreGrid a",
  ".dsHomeMode .dsRecentItem button:first-child",
  ".dsResultsMode .dsSearchForm",
  ".dsResultsMode .dsBack",
  ".dsResultsMode .dsSearchSubmit",
  ".dsResultsMode .dsTabs button",
  ".dsResultsMode .dsHudTab",
  ".dsResultsMode .dsCard",
  ".dsResultsMode .dsOrganicResult",
  ".dsResultsMode .dsSearchWithHud",
  ".dsResultsMode [aria-label='Worldwide results'] article",
  ".dsResultsMode [aria-label='Videos from the web'] a",
  ".dsResultsMode [aria-label='Worldwide results'] a[aria-label]",
  ".dsResultsMode [aria-label='Sources for this AI overview'] a",
  ".dsSuggestions button"
].join(", ");

const REACH_PX = 68;
const MAX_OFFSET_PX = 1.4;

export function useSearchMagneticMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active: HTMLElement | null = null;
    let pressed: HTMLElement | null = null;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let tapTimer = 0;

    const clearActive = () => {
      if (!active) return;
      active.classList.remove("dsMagnetNear", "dsMagnetTarget");
      active.style.removeProperty("--ds-magnet-scale");
      active.style.removeProperty("--ds-magnet-x");
      active.style.removeProperty("--ds-magnet-y");
      active = null;
    };

    const clearPress = () => {
      window.clearTimeout(tapTimer);
      if (pressed) pressed.classList.remove("dsMagnetTap", "dsMagnetTarget");
      pressed = null;
    };

    const allowed = (element: HTMLElement) =>
      root.contains(element) &&
      !element.matches(":disabled, [aria-disabled='true']") &&
      element.getClientRects().length > 0 &&
      !element.closest("[aria-hidden='true']");

    const animateClosest = () => {
      frame = 0;
      if (!finePointer.matches || reducedMotion.matches ||
          root.querySelector(".dsSignoutBackdrop, .dsChatOverlay")) {
        clearActive();
        return;
      }

      let nearest: HTMLElement | null = null;
      let nearestRect: DOMRect | null = null;
      let best = Infinity;
      let nearestDistance = Infinity;

      for (const element of root.querySelectorAll<HTMLElement>(MAGNETIC_TARGETS)) {
        if (!allowed(element)) continue;
        // Avoid distracting motion while somebody is typing into the search field.
        if (element.matches(".dsSearchForm") && element.contains(document.activeElement)) continue;

        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        // Distance to the edges, so the response begins *before* the mouse reaches a target.
        const distance = Math.hypot(
          Math.max(rect.left - pointerX, 0, pointerX - rect.right),
          Math.max(rect.top - pointerY, 0, pointerY - rect.bottom)
        );
        if (distance > REACH_PX) continue;
        // When targets nest (HudHud inside the search bar), prefer the smaller control.
        const score = distance + Math.log1p(rect.width * rect.height) * 0.002;
        if (score >= best) continue;
        best = score;
        nearest = element;
        nearestRect = rect;
        nearestDistance = distance;
      }

      if (nearest !== active) clearActive();
      if (!nearest || !nearestRect) return;
      active = nearest;

      const strength = Math.pow(Math.max(0, 1 - nearestDistance / REACH_PX), 1.45);
      const compact = nearest.matches(".dsUtilityButton, .dsHudDock, .dsTabs button");
      const search = nearest.matches(".dsSearchForm");
      const maximumScale = search ? 0.006 : compact ? 0.018 : 0.012;
      const horizontal = Math.max(-1, Math.min(1, (pointerX - (nearestRect.left + nearestRect.width / 2)) / Math.max(nearestRect.width / 2, 1)));
      const vertical = Math.max(-1, Math.min(1, (pointerY - (nearestRect.top + nearestRect.height / 2)) / Math.max(nearestRect.height / 2, 1)));

      nearest.classList.add("dsMagnetTarget", "dsMagnetNear");
      nearest.style.setProperty("--ds-magnet-scale", (1 + maximumScale * strength).toFixed(4));
      nearest.style.setProperty("--ds-magnet-x", (horizontal * MAX_OFFSET_PX * strength).toFixed(2) + "px");
      nearest.style.setProperty("--ds-magnet-y", (vertical * MAX_OFFSET_PX * strength).toFixed(2) + "px");
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      if (!finePointer.matches || reducedMotion.matches || event.buttons) {
        clearActive();
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(animateClosest);
    };

    const onPress = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || reducedMotion.matches) return;
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>(MAGNETIC_TARGETS);
      if (!element || !allowed(element) || root.querySelector(".dsSignoutBackdrop, .dsChatOverlay")) return;
      clearPress();
      pressed = element;
      element.classList.add("dsMagnetTarget", "dsMagnetTap");
    };

    const onRelease = () => {
      if (!pressed) return;
      // Give taps a short press acknowledgement, then return gently over 500ms.
      window.clearTimeout(tapTimer);
      tapTimer = window.setTimeout(clearPress, 110);
    };

    const onCancel = () => clearPress();
    const onPreferenceChange = () => { clearActive(); clearPress(); };
    const onLeave = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      clearActive();
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onPress, { passive: true });
    root.addEventListener("pointerup", onRelease);
    root.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onPreferenceChange);
    finePointer.addEventListener("change", onPreferenceChange);
    reducedMotion.addEventListener("change", onPreferenceChange);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onPress);
      root.removeEventListener("pointerup", onRelease);
      root.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onPreferenceChange);
      finePointer.removeEventListener("change", onPreferenceChange);
      reducedMotion.removeEventListener("change", onPreferenceChange);
      if (frame) window.cancelAnimationFrame(frame);
      clearActive();
      clearPress();
    };
  }, [rootRef]);
}
