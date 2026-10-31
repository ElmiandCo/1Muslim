/** LiveGuests1.0 policy shared by server token and webhook handlers. */
export type GuestMode = "pfp" | "camera";
export const guestLimitForAspectRatio = (aspectRatio: string | null | undefined) =>
  aspectRatio === "1:1" ? 11 : 3;
export const guestMayPublishCamera = (
  aspectRatio: string | null | undefined,
  mode: GuestMode,
) => aspectRatio !== "1:1" && mode === "camera";
export const guestMayPublishMicrophone = (hostMuted: boolean) => !hostMuted;
export const isGuestIdentity = (identity: string, hostId: string) =>
  identity !== hostId && /^[0-9a-f-]{36}$/i.test(identity);
