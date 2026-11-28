import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const memberHome=readFileSync(new URL("../app/search/SearchMemberHome.tsx",import.meta.url),"utf8");
const styles=readFileSync(new URL("../app/search/search-member-home.css",import.meta.url),"utf8");

test("Search Home voice errors dismiss themselves after two seconds",()=>{
 assert.ok(memberHome.includes('const timer=window.setTimeout(()=>setVoiceError(""),2000)'));
 assert.match(memberHome,/return\(\)=>window\.clearTimeout\(timer\)/);
 assert.match(memberHome,/\[voiceError\]/);
 assert.match(styles,/smhBriefNotice 2s/);
});

test("Search Home shows only an accessible circle for spoken replies",()=>{
 assert.doesNotMatch(memberHome,/Hear the greeting|AI spoken replies on|AI spoken replies off|greetingFailed|setGreetingFailed/);
 assert.match(memberHome,/className="smhVoiceToggle"/);
 assert.match(memberHome,/aria-label=\{voiceOn\?"Turn spoken replies off":"Turn spoken replies on"\}/);
 assert.match(memberHome,/aria-pressed=\{voiceOn\}/);
 assert.match(memberHome,/className="smhVoiceDot"/);
 assert.match(styles,/\.smhVoiceToggle\[aria-pressed="true"\] \.smhVoiceDot\{background:#20af75/);
});

test("Microphone permission recovery and reduced-motion remain functional",()=>{
 assert.match(memberHome,/Enable microphone to speak/);
 assert.match(memberHome,/onClick=\{toggleMic\}/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)\{\.smhVoiceToggle/);
});
