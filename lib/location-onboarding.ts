/** A saved choice ends the automatic prompt, including an earlier decline. */
export function shouldPromptForLocation(decision: { decision: string } | null): boolean {
  return decision === null;
}

type Place = { city: string; state: string; country: string };

type LocationSteps = {
  locate: () => Promise<Place>;
  isCurrent: () => boolean;
  savePlace: (place: Place) => Promise<void>;
  recordAccepted: () => Promise<void>;
};

/** Keep acceptance after the profile write, and abandon work for a changed account. */
export async function acceptLocation(steps: LocationSteps): Promise<boolean> {
  const place = await steps.locate();
  if (!steps.isCurrent()) return false;
  await steps.savePlace(place);
  if (!steps.isCurrent()) return false;
  await steps.recordAccepted();
  return steps.isCurrent();
}
