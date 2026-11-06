/** Pure editorial cutoff rule; never cut a video without a configured endpoint. */
export function shouldOfferContinue(seconds, endSeconds, continued) {
  return Number.isFinite(seconds) && Number.isFinite(endSeconds) &&
    endSeconds >= 0 && !continued && seconds >= endSeconds;
}
export function remainingContinueSeconds(elapsedMs) {
  return Math.max(1, 3 - Math.floor(Math.max(0, elapsedMs) / 1000));
}
