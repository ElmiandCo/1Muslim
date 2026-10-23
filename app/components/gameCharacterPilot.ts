/**
 * Titan character asset gate. No game renderer is replaced by this module.
 * Call only after an actual /public/assets/game/characters/*.glb asset is installed.
 * Existing WebGL avatars remain the fallback until a GLB renderer is integrated.
 */
export type CharacterMotion="idle"|"walk"|"run"|"fly";
export type CharacterAssetInfo={byteLength:number;meshes:number;skins:number;animations:string[]};

export const characterMotion=(horizontalSpeed:number,flying:boolean):CharacterMotion=>{
 if(flying)return "fly";
 if(!Number.isFinite(horizontalSpeed)||horizontalSpeed<0.25)return "idle";
 return horizontalSpeed>=6?"run":"walk";
};

export const CHARACTER_ASSET_PATH="/assets/game/characters/explorer.glb";
const MAX_CHARACTER_BYTES=12*1024*1024;

/** Validate a real GLB 2.0 file before handing it to a future renderer.
 * Never treats a missing, corrupt or oversized asset as a successful load.
 */
export async function inspectCharacterGLB(url:string,signal?:AbortSignal):Promise<CharacterAssetInfo>{
 if(!url.startsWith("/assets/game/characters/")||!url.endsWith(".glb"))throw new Error("Character asset path must be a local .glb");
 const response=await fetch(url,{signal,cache:"force-cache"});
 if(!response.ok)throw new Error("Character asset unavailable: "+response.status);
 const sizeHeader=Number(response.headers.get("content-length"));
 if(Number.isFinite(sizeHeader)&&sizeHeader>MAX_CHARACTER_BYTES)throw new Error("Character GLB exceeds mobile size budget");
 // Stream the asset with a hard cap: servers may omit or misreport Content-Length.
 // This avoids buffering an arbitrarily large GLB on memory-constrained phones.
 let bytes:ArrayBuffer;
 if(response.body){
  const reader=response.body.getReader();
  const chunks:Uint8Array[]=[];
  let total=0;
  const header=new Uint8Array(12);
  let headerBytes=0;
  try{
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    total+=value.byteLength;
    const copied=Math.min(12-headerBytes,value.byteLength);
    if(copied>0){header.set(value.subarray(0,copied),headerBytes);headerBytes+=copied;}
    if(headerBytes===12){
     const view=new DataView(header.buffer);
     const declaredLength=view.getUint32(8,true);
     if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||declaredLength<20||declaredLength>MAX_CHARACTER_BYTES){
      await reader.cancel();
      throw new Error("Character GLB header invalid or exceeds mobile size budget");
     }
    }
    if(total>MAX_CHARACTER_BYTES){
     await reader.cancel();
     throw new Error("Character GLB exceeds mobile size budget");
    }
    chunks.push(value);
   }
  }finally{reader.releaseLock()}
  bytes=new ArrayBuffer(total);
  const combined=new Uint8Array(bytes);
  let offset=0;
  for(const chunk of chunks){combined.set(chunk,offset);offset+=chunk.byteLength}
 }else{
  bytes=await response.arrayBuffer();
 }
 if(bytes.byteLength<20||bytes.byteLength>MAX_CHARACTER_BYTES)throw new Error("Character GLB size invalid");
 const view=new DataView(bytes);
 if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.byteLength)throw new Error("Invalid GLB 2.0 header");
 const jsonLength=view.getUint32(12,true),jsonType=view.getUint32(16,true);
 if(jsonType!==0x4e4f534a||jsonLength===0||jsonLength>bytes.byteLength-20)throw new Error("Invalid GLB JSON chunk");
 let gltf:unknown;
 try{gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,jsonLength)))}catch{throw new Error("Character GLB JSON invalid")}
 if(!gltf||typeof gltf!=="object")throw new Error("Character GLB root invalid");
 const data=gltf as Record<string,unknown>;
 const asset=data.asset as {version?:unknown}|undefined;
 if(asset?.version!=="2.0")throw new Error("Unsupported glTF asset version");
 const meshes=Array.isArray(data.meshes)?data.meshes.length:0;
 const skins=Array.isArray(data.skins)?data.skins.length:0;
 const animations=Array.isArray(data.animations)?data.animations.map((clip:unknown,i:number)=>{
  const name=clip&&typeof clip==="object"&&(clip as {name?:unknown}).name;
  return typeof name==="string"?name:"clip-"+i;
 }):[];
 if(meshes<1)throw new Error("Character GLB has no mesh");
 return {byteLength:bytes.byteLength,meshes,skins,animations};
}
