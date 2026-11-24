export function registeredTikTokCallback(origin: string) {
  const callback = `${origin}/api/tiktok/callback`;
  return callback.startsWith("https://") && process.env.TIKTOK_REDIRECT_URI === callback
    ? callback
    : null;
}

export function hasTikTokImportScopes(scope: unknown) {
  if (typeof scope !== "string") return false;
  const scopes = scope.split(/[\s,]+/);
  return scopes.includes("user.info.basic") && scopes.includes("video.list");
}
