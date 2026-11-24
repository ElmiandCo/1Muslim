import assert from "node:assert/strict";
import test from "node:test";
import { isTikTokVideoId, verifiedTikTokVideo } from "../utils/tiktok/public-video.ts";
import { hasTikTokImportScopes, registeredTikTokCallback } from "../utils/tiktok/oauth.ts";

const id = "7123456789012345678";
const url = `https://www.tiktok.com/@creator/video/${id}`;

test("preserves string IDs and canonicalizes a matching Display API result", () => {
  assert.equal(isTikTokVideoId(Number(id)), false);
  assert.deepEqual(verifiedTikTokVideo({ id, share_url: url + "?tracking=1", title: " Clip " }, id), {
    id, title: "Clip", url,
  });
});

test("rejects missing videos, mismatched IDs, and unexpected TikTok URLs", () => {
  for (const record of [
    undefined, { id: "12345678", share_url: url },
    ...[url.replace(id, "12345678"), url.replace(".com", ".com.example.org"),
      url.replace(".com", ".com:8443"), url.replace("www.", "other@www."),
      url.replace("https:", "http:")].map(share_url => ({ id, share_url })),
  ]) {
    assert.equal(verifiedTikTokVideo(record, id), null);
  }
});

test("requires both import permissions", () => {
  assert.equal(hasTikTokImportScopes("user.info.basic,video.list"), true);
  assert.equal(hasTikTokImportScopes("user.info.basic video.list"), true);
  assert.equal(hasTikTokImportScopes("user.info.basic,video.list.other"), false);
  assert.equal(hasTikTokImportScopes(undefined), false);
});

test("only uses the registered HTTPS callback", () => {
  const prior = process.env.TIKTOK_REDIRECT_URI;
  try {
    process.env.TIKTOK_REDIRECT_URI = "https://example.test/api/tiktok/callback";
    assert.equal(registeredTikTokCallback("https://example.test"), process.env.TIKTOK_REDIRECT_URI);
    assert.equal(registeredTikTokCallback("https://other.test"), null);
    assert.equal(registeredTikTokCallback("http://example.test"), null);
  } finally {
    if (prior === undefined) delete process.env.TIKTOK_REDIRECT_URI;
    else process.env.TIKTOK_REDIRECT_URI = prior;
  }
});
