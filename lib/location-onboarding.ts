/** A saved choice ends the automatic prompt, including an earlier decline. */
export function shouldPromptForLocation(decision: { decision: string } | null): boolean {
  return decision === null;
}
