import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {adminDb} from "../../../../lib/stripe-unlocked";

export const runtime="nodejs";
export const maxDuration=120;
const noStore={"Cache-Control":"private, no-store"};
const allowedTypes=new Set(["image/png","image/jpeg","image/webp"]);
const MAX_FILE=3_000_000;

function respond(data:unknown,status=200){
 return NextResponse.json(data,{status,headers:noStore});
}

/** Image creation is explicit, private to the requesting member, and metered on the server. */
export async function POST(req:NextRequest){
 try{
  const length=Number(req.headers.get("content-length")||"0");
  if(length>5_000_000)return respond({error:"Choose an image smaller than 3 MB."},413);
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return respond({error:"Sign in to create or edit images with HudHud."},401);

  const form=await req.formData();
  const mode=form.get("mode")==="edit"?"edit":"generate";
  const prompt=String(form.get("prompt")||"").trim();
  if(!prompt||prompt.length>1200)return respond({error:"Describe your image in 1–1200 characters."},400);
  const input=form.get("image");
  const file=input instanceof File?input:null;
  if(mode==="edit"&&!file)return respond({error:"Attach an image before requesting an edit."},400);
  if(file&&(!allowedTypes.has(file.type)||file.size>MAX_FILE||file.size<100)){
   return respond({error:"Use a PNG, JPEG, or WebP image smaller than 3 MB."},400);
  }

  // Shared atomic limits across Vercel instances. Fail closed if the budget system is unavailable.
  const day=new Date().toISOString().slice(0,10);
  const admin=adminDb();
  const {data:withinUser,error:userQuotaError}=await admin.rpc("claim_search_api_quota",{
   p_key:"hudhud-image:v1:member:"+user.id+":"+day,p_max:5,p_window_seconds:86400
  });
  if(userQuotaError||withinUser!==true)return respond({error:"Your image allowance is unavailable or used for today. Try again tomorrow."},429);
  const {data:withinGlobal,error:globalQuotaError}=await admin.rpc("claim_search_api_quota",{
   p_key:"hudhud-image:v1:global:"+day,p_max:90,p_window_seconds:86400
  });
  if(globalQuotaError||withinGlobal!==true)return respond({error:"HudHud image generation is at today's capacity."},429);

  const key=process.env.OPENAI_API_KEY;
  if(!key)return respond({error:"HudHud image generation is not configured yet."},503);
  const guidance="Create a polished 9:16 visual for the 1Muslim HudHud image studio. "
   +"Maintain clean composition and usable space for a separate editable headline and bordered banner. "
   +"Do NOT render words, Arabic characters, watermarks, logos or typographic decorations: "
   +"the application adds exact editable multilingual text as a vector overlay. User direction: "+prompt;
  let upstream:Response;
  if(mode==="edit"&&file){
   const upload=new FormData();
   upload.set("model","gpt-image-1");
   upload.set("prompt","Edit the attached image respectfully, retaining its overall composition unless instructed otherwise. "
    +"Any new headline or banner lettering will be rendered separately as editable text; do not invent text. "+prompt);
   upload.set("size","1024x1536");
   upload.set("quality","medium");
   upload.set("image",file,file.name||"reference.png");
   upstream=await fetch("https://api.openai.com/v1/images/edits",{
    method:"POST",headers:{Authorization:"Bearer "+key},body:upload,signal:AbortSignal.timeout(115000)
   });
  }else{
   upstream=await fetch("https://api.openai.com/v1/images/generations",{
    method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({model:"gpt-image-1",prompt:guidance,size:"1024x1536",quality:"medium"}),
    signal:AbortSignal.timeout(115000)
   });
  }
  if(!upstream.ok)return respond({error:"The image service couldn't complete that request. Please try a different prompt."},502);
  const result=await upstream.json() as {data?:Array<{b64_json?:string}>};
  const b64=result.data?.[0]?.b64_json;
  if(typeof b64!=="string"||!b64.length)return respond({error:"No image was returned. Please try again."},502);
  return respond({image:"data:image/png;base64,"+b64});
 }catch(error){
  if(error instanceof Error&&error.name==="TimeoutError")return respond({error:"The image request timed out. Please try again."},504);
  return respond({error:"HudHud couldn't prepare this image right now."},503);
 }
}
