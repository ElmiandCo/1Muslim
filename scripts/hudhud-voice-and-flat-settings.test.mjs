import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const member=read("app/search/SearchMemberHome.tsx");
const guest=read("app/search/page.tsx");
const player=read("app/lib/hudhud-ai-voice-player.ts");
const preference=read("app/lib/hudhud-voice-preference.ts");
const hudhud=read("app/hudhud/page.tsx");
const settings=read("app/settings/SettingsContent.tsx");
const center=read("app/settings/SettingsHudHudCenter.tsx");
const profile=read("app/profile/page.tsx");
const canvas=read("app/components/GlobalSettingsCanvas.tsx");
const flatCss=read("app/components/global-settings-canvas.css");
const chat=read("app/components/HudHudChatWindow.tsx");
const chatCss=read("app/components/HudHudChatWindow.module.css");
const launcher=read("app/components/HudHudChatLauncher.tsx");

test("one shared voice setting defaults on for old guest and member accounts",()=>{
 assert.match(preference,/HUDHUD_VOICE_KEY="1muslim:hudhud:voice-read-aloud"/);
 assert.match(preference,/if\(value==="on"\|\|value==="off"\)return value!=="off"/);
 assert.match(preference,/return true;/);
 assert.match(preference,/FIRST_MUTE_KEY/);
 assert.match(preference,/window.dispatchEvent\(new Event\(HUDHUD_VOICE_EVENT\)\)/);
 assert.match(member,/setHudHudVoiceEnabled\(next\)/);
 assert.match(guest,/setHudHudVoiceEnabled\(next\)/);
 assert.match(hudhud,/setHudHudVoiceEnabled\(next\)/);
 assert.doesNotMatch(launcher,/const toggleVoice=/);
 assert.doesNotMatch(center,/Read replies aloud|HudHud voice settings/);
});

test("speaker icon lives on top-left Search, status only once when muted",()=>{
 assert.match(member,/className="smhHeaderSpeaker"/);
 assert.match(guest,/className="dsUtilityButton dsGuestVoice"/);
 assert.match(member,/firstHudHudMuteNotice\(\)/);
 assert.match(guest,/firstHudHudMuteNotice\(\)/);
 assert.ok(member.includes('window.setTimeout(()=>setVoiceError(""),2000)'));
 assert.doesNotMatch(member,/Voice stopped\. Tap the mic/);
});

test("HudHud can recover from iOS autoplay-blocked AI speech without microphone access",()=>{
 assert.match(player,/\/api\/hudhud\/speech/);
 assert.match(player,/SpeechSynthesisUtterance/);
 assert.match(player,/nativeSpeak\(spoken,turn,onStart,mood\)/);
 assert.match(player,/signal.signal.aborted/);
 assert.match(player,/window.speechSynthesis.cancel\(\)/);
 assert.match(chat,/latest.role==="hudhud"&&voiceAllowed/);
 assert.match(chat,/lastSeenMessage.current===null/);
 assert.match(chat,/setVoiceAllowed\(on\)/);
});

test("Appearance owns auto microphone, updates instantly and profile Save closes sheet",()=>{
 assert.match(settings,/id="hudhud-mic-settings"/);
 assert.match(settings,/1muslim:hudhud:auto-listen/);
 assert.match(settings,/1muslim:hudhud-mic-preference/);
 assert.match(member,/autoMicEnabled/);
 assert.match(profile,/if\(embeddedEditorTab\)window.dispatchEvent\(new Event\("1muslim:close-settings"\)\)/);
 assert.match(profile,/1muslim:appearance-updated/);
 assert.match(canvas,/data-panel=\{panel\}/);
 assert.match(flatCss,/\.gscInlineSettings \.settingsCard,\.gscInlineSettings \.dangerCard\{background:#fff!important;border:0!important/);
});

test("HudHud chat follows black night and white daylight appearance",()=>{
 assert.match(chatCss,/\.shell\{background:#070809;color:#eff4f2\}/);
 assert.match(chatCss,/:global\(html.light\) \.shell/);
 assert.match(chatCss,/:global\(html\[data-one-chrome="day"\]\) \.shell/);
});

test("HudHud's AI voice reads a short highlight, not the full printed paragraph",async()=>{
 const {selectHudHudSpokenText}=await import("../app/lib/hudhud-ai-voice-player.ts");
 const paragraph="Welcome to 1Muslim! "+"We have many resources for people to explore and enjoy. ".repeat(12);
 const spoken=selectHudHudSpokenText(paragraph);
 assert.ok(spoken.length<250);
 assert.ok(spoken.length<paragraph.length/2);
 assert.equal(selectHudHudSpokenText("As-salamu alaykum. I'm HudHud."),"As-salamu alaykum. I'm HudHud.");
 assert.ok(player.includes("body:JSON.stringify({text:spoken,mood})"));
 const ttsRoute=read("app/api/hudhud/speech/route.ts");
 assert.ok(ttsRoute.includes("voiceDirection(text,mood)"));
 assert.ok(ttsRoute.includes('voice:"nova"'));
});
test("HudHud idle reflections are gentle, bounded, and never assert silent recordings were deleted",async()=>{
 const {hudHudQuietReflection,HUDHUD_IDLE_DELAY_MS,HUDHUD_MAX_UNANSWERED_PROMPTS}=await import("../app/lib/use-hudhud-idle-companion.ts");
 assert.equal(HUDHUD_IDLE_DELAY_MS,15000);
 assert.equal(HUDHUD_MAX_UNANSWERED_PROMPTS,5);
 const phrases=Array.from({length:5},(_,index)=>hudHudQuietReflection(index+1,false,true));
 assert.equal(new Set(phrases).size,5);
 assert.ok(phrases[1].toLowerCase().includes("sign in"));
 assert.ok(phrases[2].includes("chapter twenty-nine"));
 assert.ok(phrases[4].toLowerCase().includes("quiet now"));
 assert.ok(phrases.every(x=>!/(?:deleted audio|silence is deleted|audio is discarded)/i.test(x)));
 assert.ok(member.includes("useHudHudIdleCompanion"));
 assert.ok(hudhud.includes("useHudHudIdleCompanion"));
 assert.ok(member.includes("As-salamu alaykum. I'm HudHud."));
 assert.ok(hudhud.includes("As-salamu alaykum. I'm HudHud."));
});
