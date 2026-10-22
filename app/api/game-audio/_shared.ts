import {createHmac, randomUUID, timingSafeEqual} from "node:crypto";
import {AccessToken, RoomServiceClient, TrackSource} from "livekit-server-sdk";

export const GAME_AUDIO_PREFIX = "1muslim-game-audio-";
const NAME_RE = /^1muslim-game-audio-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const GAME_AUDIO_LIMIT = 16;

type RoomMetadata = {kind:"game-audio";hostId:string;title:string;createdAt:number;visibility:"public"};
export function isGameAudioRoom(name:unknown):name is string {
  return typeof name==="string" && NAME_RE.test(name);
}
export function parseRoomMetadata(raw:string):RoomMetadata|null {
  try {
    const value:unknown=JSON.parse(raw);
    if(!value || typeof value!=="object")return null;
    const m=value as Partial<RoomMetadata>;
    return m.kind==="game-audio" && m.visibility==="public" && typeof m.hostId==="string" && /^[0-9a-f-]{36}$/i.test(m.hostId) && typeof m.title==="string" && typeof m.createdAt==="number"
      ? m as RoomMetadata : null;
  } catch {return null;}
}
export function getGameAudioService(){
  const key=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET,url=process.env.LIVEKIT_URL;
  if(!key||!secret||!url)return null;
  let endpoint:URL;
  try {
    endpoint=new URL(url);
    if(endpoint.protocol==="wss:")endpoint.protocol="https:";
    else if(endpoint.protocol==="ws:")endpoint.protocol="http:";
    if(endpoint.protocol!=="https:" && endpoint.protocol!=="http:")return null;
  }catch{return null;}
  return {key,secret,url,service:new RoomServiceClient(endpoint.toString(),key,secret)};
}
export function makeRoomName(){return GAME_AUDIO_PREFIX+randomUUID();}
export function roomMetadata(hostId:string,title:string):RoomMetadata {
  return {kind:"game-audio",hostId,title:title.trim().slice(0,64)||"Game Audio Room",createdAt:Date.now(),visibility:"public"};
}
export async function lookupGameRoom(service:RoomServiceClient,name:unknown){
  if(!isGameAudioRoom(name))return null;
  const rooms=await service.listRooms([name]);
  const room=rooms.find(item=>item.name===name);
  if(!room)return null;
  const meta=parseRoomMetadata(room.metadata);
  return meta?{room,meta}:null;
}
type Invitation = {roomId:string;targetUserId:string;hostId:string;expiresAt:number;nonce:string};
function sign(payload:string,secret:string){
  return createHmac("sha256",secret).update("1muslim-game-audio-invite-v1:"+payload).digest("base64url");
}
export function createSpeakerInvite(roomId:string,targetUserId:string,hostId:string,secret:string){
  const expiresAt=Date.now()+90_000;
  const payload=Buffer.from(JSON.stringify({roomId,targetUserId,hostId,expiresAt,nonce:randomUUID()} satisfies Invitation)).toString("base64url");
  return {invite:payload+"."+sign(payload,secret),expiresAt};
}
export function verifySpeakerInvite(invite:unknown,roomId:string,targetUserId:string,hostId:string,secret:string){
  if(typeof invite!=="string"||invite.length>1200)return false;
  const [payload,signature,...rest]=invite.split(".");
  if(!payload||!signature||rest.length)return false;
  const expected=Buffer.from(sign(payload,secret));
  const supplied=Buffer.from(signature);
  if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))return false;
  try {
    const item=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as Partial<Invitation>;
    return item.roomId===roomId && item.targetUserId===targetUserId && item.hostId===hostId && typeof item.expiresAt==="number" && item.expiresAt>Date.now() && item.expiresAt<Date.now()+91_000;
  }catch{return false;}
}
export async function makeAudioToken(key:string,secret:string,roomId:string,user:{id:string;user_metadata?:{full_name?:string|null;username?:string|null}},canSpeak:boolean){
  const name=String(user.user_metadata?.full_name||user.user_metadata?.username||"1Muslim member").slice(0,48);
  const token=new AccessToken(key,secret,{identity:user.id,name,ttl:"1h"});
  token.addGrant({roomJoin:true,room:roomId,canSubscribe:true,canPublish:canSpeak,canPublishSources:canSpeak?[TrackSource.MICROPHONE]:[],canPublishData:true});
  return token.toJwt();
}
