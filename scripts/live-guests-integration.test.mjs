// Source-contract regression checks. These are NOT substitutes for two-device LiveKit tests.
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {guestLimitForAspectRatio,guestMayPublishCamera,guestMayPublishMicrophone} from "../lib/live-guest-policy.ts";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("video and audio have separate, enforced seat capacities",()=>{
  assert.equal(guestLimitForAspectRatio("9:16"),3);
  assert.equal(guestLimitForAspectRatio("16:9"),3);
  assert.equal(guestLimitForAspectRatio("1:1"),11);
  const sql=source("supabase/migrations/20261031071703_liveguests1_capacity_and_roles.sql");
  assert.match(sql,/v_limit\s*:=\s*case\s+when\s+v_ratio\s*=\s*'1:1'\s+then\s+11\s+else\s+3/);
  assert.match(sql,/Remove audio guests until only three remain before switching to video/);
  const modeRoute=source("app/api/live-mode/route.ts");
  assert.match(modeRoute,/mode === "voice"/);
  assert.match(modeRoute,/mutePublishedTrack\(/);
});
test("audio-only rooms cannot request or publish camera",()=>{
  assert.equal(guestMayPublishCamera("1:1","camera"),false);
  assert.equal(guestMayPublishCamera("9:16","camera"),true);
  assert.equal(guestMayPublishCamera("9:16","pfp"),false);
  const studio=source("components/LiveGuestStudio.tsx");
  assert.match(studio,/audioOnly\?"pfp":mode/);
  assert.match(studio,/audioOnly!==true&&<option value="camera">/);
  const sql=source("supabase/migrations/20261031071703_liveguests1_capacity_and_roles.sql");
  assert.match(sql,/Audio rooms are microphone-only/);
});
test("guests need approval and restricted publishing tokens",()=>{
  const token=source("app/api/livekit/token/route.ts");
  assert.match(token,/\.eq\("status",\s*"approved"\)/);
  assert.match(token,/guestMayPublishCamera\(/);
  assert.match(token,/canPublishSources:\s*publishSources/);
  assert.match(token,/role === "guest" && \(!guestMuted/);
  assert.match(token,/!user && \(role !== "viewer"/);
});
test("host alone moderates and revokes guest access",()=>{
  const api=source("app/api/live-guests/moderate/route.ts");
  assert.match(api,/stream\.host_id !== user\.id/);
  assert.match(api,/moderate_live_guest/);
  assert.match(api,/removeParticipant\(/);
  assert.match(api,/mutePublishedTrack\(/);
});
test("joining requires explicit camera and microphone consent",()=>{
  const studio=source("components/LiveGuestStudio.tsx");
  assert.match(studio,/if\(!mediaConsent\)/);
  assert.match(studio,/type="checkbox" checked=\{mediaConsent\}/);
  assert.match(studio,/disabled=\{busy\|\|!mediaConsent\}/);
});
test("signed-out viewer can watch but only authenticated guests request",()=>{
  const token=source("app/api/livekit/token/route.ts");
  assert.match(token,/!user && \(role !== "viewer" \|\| liveStream\.visibility !== "public"\)/);
  const viewer=source("components/LiveKitViewer.tsx");
  assert.match(viewer,/embedded&&streamId&&hostIdentity&&!hostEnded/);
  assert.match(viewer,/Request to Join/);
});
test("guest cameras cannot steal host video or screen share",()=>{
  const viewer=source("components/LiveKitViewer.tsx");
  assert.match(viewer,/participantIdentity\.startsWith\(host\+":screen:"\)/);
  assert.match(viewer,/LiveGuestsStage mode=\{guestStageMode\}/);
  const stage=source("components/LiveGuestsStage.tsx");
  assert.match(stage,/aria-hidden=\{mode==="audio"\}/);
});
test("cinema camera freeze and fullscreen comments survive integration",()=>{
  const host=source("app/streaming/go-live/page.tsx");
  assert.match(host,/cameraFreezeFrame/);
  assert.match(host,/setTimeout\(\(\)=>\{setCameraFreezeFrame\(null\)/);
  assert.match(host,/\},400\)/);
  assert.match(host,/guestRoster=useLiveGuestRoster/);
  const modeHandler=host.slice(host.indexOf("const selectStudioMode="),host.indexOf("useEffect(()=>{",host.indexOf("const selectStudioMode=")));
  assert.ok(modeHandler.indexOf('fetch("/api/live-mode"')<modeHandler.indexOf("await syncPublishedCameraForMode("),"mode authorization must precede camera publication");
  const cinema=source("components/LiveCinemaTheater.tsx");
  assert.match(cinema,/cinemaKeyboardOffset/);
  assert.match(cinema,/className="omLiveTheaterChat"/);
  assert.match(cinema,/onFocusCapture=/);
});
