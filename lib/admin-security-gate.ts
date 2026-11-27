import {createHmac,timingSafeEqual} from "node:crypto";
export const ADMIN_GATE_COOKIE="1muslim_admin_rechecked";
function secret(){return process.env.HUDHUD_ADMIN_GATE_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY||""}
export function signAdminGate(userId:string,seconds=600){
 const key=secret();if(!key)throw Error("Admin verification unavailable");
 const expires=Math.floor(Date.now()/1000)+seconds;
 const payload=Buffer.from(JSON.stringify({u:userId,e:expires})).toString("base64url");
 const sig=createHmac("sha256",key).update(payload).digest("hex");
 return payload+"."+sig;
}
export function validAdminGate(value:string|undefined,userId:string){
 const key=secret();if(!key||!value||value.length>700)return false;
 const [payload,sig]=value.split(".");
 if(!payload||!sig||!/^[a-f0-9]{64}$/.test(sig))return false;
 const expected=createHmac("sha256",key).update(payload).digest("hex");
 if(!timingSafeEqual(Buffer.from(sig,"hex"),Buffer.from(expected,"hex")))return false;
 try{
  const decoded=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
  return decoded?.u===userId&&Number.isInteger(decoded.e)&&decoded.e>Math.floor(Date.now()/1000)&&decoded.e<=Math.floor(Date.now()/1000)+600;
 }catch{return false}
}
