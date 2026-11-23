/** Validate actual GLB binary structure before a character enters Story Mode.
 * This does not replace runtime skin binding, visual review, or animation playback.
 * No external renderer dependency; safe to use in preview asset loading.
 */
export type GlbInspection = {valid:boolean; errors:string[]; meshCount:number; skinnedMeshCount:number; boneCount:number; animationNames:string[]; materialCount:number};
const REQUIRED=["idle","walk","run","jump","dodge","attack","enter-vehicle","drive","hit"] as const;
export function inspectCharacterGlb(input:ArrayBuffer, clipNames:Readonly<Record<(typeof REQUIRED)[number],string>>):GlbInspection {
 const errors:string[]=[]; const fail=(message:string)=>errors.push(message);
 const empty=():GlbInspection=>({valid:false,errors,meshCount:0,skinnedMeshCount:0,boneCount:0,animationNames:[],materialCount:0});
 if(input.byteLength<20){fail("GLB header is incomplete");return empty()}
 const view=new DataView(input);
 if(view.getUint32(0,true)!==0x46546c67){fail("Not a glTF binary (GLB)");return empty()}
 if(view.getUint32(4,true)!==2){fail("Only GLB version 2 is supported");return empty()}
 if(view.getUint32(8,true)!==input.byteLength){fail("GLB declared length differs from buffer");return empty()}
 const jsonLength=view.getUint32(12,true),chunkType=view.getUint32(16,true);
 if(chunkType!==0x4e4f534a||jsonLength===0||jsonLength%4!==0||jsonLength>input.byteLength-20){fail("Invalid GLB JSON chunk");return empty()}
 let doc:any;
 try {doc=JSON.parse(new TextDecoder().decode(new Uint8Array(input,20,jsonLength)))} catch {fail("GLB JSON cannot be parsed");return empty()}
 if(doc?.asset?.version!=="2.0")fail("Missing glTF 2.0 asset declaration");
 const meshes=Array.isArray(doc.meshes)?doc.meshes:[],nodes=Array.isArray(doc.nodes)?doc.nodes:[],skins=Array.isArray(doc.skins)?doc.skins:[],animations=Array.isArray(doc.animations)?doc.animations:[],materials=Array.isArray(doc.materials)?doc.materials:[];
 const skinned=nodes.filter((n:any)=>Number.isInteger(n?.mesh)&&Number.isInteger(n?.skin)&&n.mesh>=0&&n.mesh<meshes.length&&n.skin>=0&&n.skin<skins.length);
 const bones=new Set<number>();
 for(const s of skins){if(!Array.isArray(s.joints)||s.joints.length===0)fail("Skin has no joints");else for(const j of s.joints){if(!Number.isInteger(j)||j<0||j>=nodes.length)fail("Skin references an invalid joint");else bones.add(j)}}
 if(!skinned.length)fail("No node binds a mesh to a skin");
 if(bones.size<12)fail("Character requires at least 12 valid rig joints");
 const names=animations.map((a:any)=>a?.name).filter((n:any):n is string=>typeof n==="string");
 if(new Set(names).size!==names.length)fail("Duplicate animation clip names");
 for(const action of REQUIRED){const clip=clipNames[action];if(!clip||!names.includes(clip))fail("Missing animation for "+action+": "+String(clip))}
 if(!materials.length)fail("No authored materials");
 return {valid:errors.length===0,errors,meshCount:meshes.length,skinnedMeshCount:skinned.length,boneCount:bones.size,animationNames:names,materialCount:materials.length};
}
