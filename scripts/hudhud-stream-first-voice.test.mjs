import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const player=read("app/lib/hudhud-ai-voice-player.ts");
const route=read("app/api/hudhud/speech/route.ts");
const search=read("app/search/SearchMemberHome.tsx");
const hudhud=read("app/hudhud/page.tsx");
const chat=read("app/components/HudHudChatWindow.tsx");
test("high-quality expressive voice uses streaming PCM from the server",()=>{
 assert.match(route,/gpt-4o-mini-tts-2025-12-15/);
 assert.match(route,/voice:"marin"/);
 assert.match(route,/response_format:streamed\?"pcm":"mp3"/);
 assert.match(route,/new NextResponse\(upstream.body/);
 assert.match(route,/claimSearchQuota\(req,"voice"\)/);
 assert.match(route,/read the supplied words exactly/i);
});
test("WebAudio context is primed from user gesture before text generation",()=>{
 assert.match(player,/function prime\(\)/);
 assert.match(player,/ctx\.resume\(\)/);
 assert.match(search,/document\.addEventListener\("pointerdown",prime/);
 assert.match(hudhud,/document\.addEventListener\("pointerdown",prime/);
 assert.match(chat,/document\.addEventListener\("pointerdown",prime/);
 assert.match(player,/response\.body\.getReader\(\)/);
 assert.match(player,/new DataView\(bytes\.buffer/);
 assert.match(player,/getInt16\(i\*2,true\)/);
 assert.match(player,/source\.start\(nextAt\)/);
 assert.match(player,/if\(result.started\|\|epoch!==turn\)return false/);
});
test("Search Home doesn't lie about speaking until actual audio begins",()=>{
 assert.match(search,/setSpeechPending\(true\);setSpeaking\(false\)/);
 assert.match(search,/player\.play\(words,\(\)=>/);
 assert.match(search,/setSpeechPending\(false\);setSpeaking\(true\)/);
 assert.match(search,/Preparing HudHud voice/);
 assert.match(search,/voiceNeedsTap&&voiceOn&&<button/);
 assert.match(search,/Tap to hear HudHud/);
 assert.match(search,/voicePlayer\.current\?\.dispose\(\)/);
});
test("HudHud full page and floating chat expose manual replay after autoplay fails",()=>{
 assert.match(hudhud,/lastVoiceReply\.current=\{text:reply/);
 assert.match(hudhud,/voiceNeedsTap&&readAloud&&<button/);
 assert.match(hudhud,/player\.prime\(\)/);
 assert.match(chat,/lastFailedVoice\.current=text/);
 assert.match(chat,/voiceNeedsTap&&voiceAllowed&&<button/);
 assert.match(chat,/player\.prime\(\)/);
});
test("Voice fallback remains on browser when streaming is blocked, never loops duplicate speech",()=>{
 assert.match(player,/nativeSpeak\(text,turn,onStart\)/);
 assert.match(player,/player\.play\(\)\.catch/);
 assert.match(player,/if\(result.started\|\|epoch!==turn\)return false/);
 assert.match(player,/request\?\.abort\(\)/);
 assert.match(player,/source\.stop\(\)/);
 assert.match(player,/function dispose\(\)/);
});
