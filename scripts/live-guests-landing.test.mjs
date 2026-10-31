import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("audio and video stage use separate capacity and geometry rules",()=>{
 const stage=read("components/LiveGuestsStage.tsx");
 const css=read("components/LiveGuestsStage.module.css");
 assert.match(stage,/mode==="video"\?3:11/);
 assert.match(stage,/className=\{styles\.audioOrbit\}/);
 assert.match(stage,/className=\{styles\.hostVideo\}/);
 assert.match(css,/grid-template-columns:minmax\(0,3fr\) minmax\(0,2fr\)/);
 assert.match(css,/\[data-count="1"\]\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
});

test("landing audio player shows the actual guest orbit and subscribes to audio",()=>{
 const source=read("app/components/HomeAudioLivePlayer.tsx");
 assert.match(source,/useLiveGuestRoster\(roomRef,connected,hostId\?\?null,11\)/);
 assert.match(source,/<LiveGuestsStage mode="audio"/);
 assert.match(source,/RoomEvent\.TrackSubscribed/);
 assert.match(source,/guestOnStageRef\.current/);
});

test("landing video preview keeps host camera separate from guest camera tiles",()=>{
 const source=read("app/components/LiveHomePreview.tsx");
 assert.match(source,/useLiveGuestRoster\(roomRef,connected,hostId\?\?null,3\)/);
 assert.match(source,/participantIdentity!==hostId/);
 assert.match(source,/<LiveGuestsStage mode="video"/);
 assert.match(source,/RoomEvent\.TrackSubscribed/);
 assert.match(source,/audioEnabledRef/);
});

test("landing request uses the active stream, stays in page and does not remove comments",()=>{
 const page=read("app/page.tsx");
 const comments=read("app/components/HomeLiveConversation.tsx");
 assert.match(page,/hostId=\{activeLive\.host_id\}/);
 assert.match(page,/roomName=\{activeLive\?\.room_name\|\|activeLive\?\.id\}/);
 assert.match(comments,/Request to join Live/);
 assert.match(comments,/Request audio seat/);
 assert.match(comments,/<LiveGuestStudio key=\{streamId\}/);
 assert.match(comments,/homeLiveDemoComments/);
 assert.match(comments,/homeLiveCommentForm/);
});

test("guest request enforces mode-specific publishing and host mute cleanup",()=>{
 const studio=read("components/LiveGuestStudio.tsx");
 assert.match(studio,/p_mode:liveMode==="audio"\?"pfp":liveMode==="video"\?"camera":mode/);
 assert.match(studio,/me\?\.status!=="approved"/);
 assert.match(studio,/source:Track\.Source\.Microphone/);
 assert.match(studio,/source:Track\.Source\.Camera/);
 assert.match(studio,/stream\.current\?\.removeTrack\(track\)/);
 assert.match(studio,/signalStage\(true\)/);
 assert.match(studio,/signalStage\(false\)/);
});

test("full-screen player retains independent comments and broadcast-specific seat mode",()=>{
 const page=read("app/streaming/live/[id]/page.tsx");
 assert.match(page,/stream\.aspect_ratio==="1:1"\?"audio":"video"/);
 assert.match(page,/omLiveTheaterChat/);
 assert.match(page,/omLiveTheaterGuestPanel/);
});
