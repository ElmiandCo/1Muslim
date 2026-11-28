"use client";

/** One stable, device-local voice preference for guests and signed-in members.
 * Speech output and microphone recognition are independent settings. */
export const HUDHUD_VOICE_KEY="1muslim:hudhud:voice-read-aloud";
const LEGACY_KEY="1muslim-hudhud-voice";
const FIRST_MUTE_KEY="1muslim:hudhud:voice-muted-notice-seen";
export const HUDHUD_VOICE_EVENT="1muslim:hudhud-voice-preference";

export function hudHudVoiceEnabled():boolean{
 if(typeof window==="undefined")return true;
 try{
  const value=localStorage.getItem(HUDHUD_VOICE_KEY);
  if(value==="on"||value==="off")return value!=="off";
  return localStorage.getItem(LEGACY_KEY)!=="off";
 }catch{return true}
}

export function setHudHudVoiceEnabled(enabled:boolean){
 if(typeof window==="undefined")return;
 try{
  localStorage.setItem(HUDHUD_VOICE_KEY,enabled?"on":"off");
  localStorage.setItem(LEGACY_KEY,enabled?"on":"off");
 }catch{}
 window.dispatchEvent(new Event(HUDHUD_VOICE_EVENT));
 window.dispatchEvent(new CustomEvent("1muslim:hudhud-voice",{detail:{enabled}}));
}

export function firstHudHudMuteNotice(){
 if(typeof window==="undefined")return false;
 try{
  if(localStorage.getItem(FIRST_MUTE_KEY)==="1")return false;
  localStorage.setItem(FIRST_MUTE_KEY,"1");
  return true;
 }catch{return false}
}
