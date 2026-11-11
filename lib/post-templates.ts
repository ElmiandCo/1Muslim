/**
 * Templated Posts 2.0 — layout registry (step 2).
 * Pure data and helpers: no editor, publishing, gallery or video behavior changes.
 * Templates use existing post assets by reference; no duplicate uploads.
 */
export const POST_CONTENT_TYPES = ["text", "quran", "image", "video"] as const;
export type PostContentType = (typeof POST_CONTENT_TYPES)[number];
export type PostOrientation = "horizontal" | "vertical";
export type PostTemplateVersion = 1;
export type PostTemplateId = `post-v1-${string}-${PostOrientation}`;
export type PostTemplate = Readonly<{
 id: PostTemplateId;
 version: PostTemplateVersion;
 combination: string;
 contentTypes: readonly PostContentType[];
 orientation: PostOrientation;
 title: string;
 description: string;
 layout: "editorial" | "cinematic";
 aspectRatio: "16 / 9" | "9 / 16";
}>;
const LABELS: Record<PostContentType,string> = {
 text:"Text",quran:"Qur’an",image:"Image",video:"Video"
};
const COMBINATIONS: readonly (readonly PostContentType[])[] = [
 ["text"],["quran"],["image"],["video"],
 ["text","quran"],["text","image"],["text","video"],
 ["quran","image"],["quran","video"],["image","video"],
 ["text","quran","image"],["text","quran","video"],
 ["text","image","video"],["quran","image","video"],
 ["text","quran","image","video"]
];
const keyFor = (types: readonly PostContentType[]) =>
 POST_CONTENT_TYPES.filter(type=>types.includes(type)).join("-");
const buildTemplate = (types:readonly PostContentType[],orientation:PostOrientation):PostTemplate=>{
 const combination=keyFor(types);
 const vertical=orientation==="vertical";
 const title=types.map(type=>LABELS[type]).join(" + ");
 return Object.freeze({
  id:`post-v1-${combination}-${orientation}` as PostTemplateId,
  version:1 as const,combination,
  contentTypes:Object.freeze([...types]),
  orientation,
  title:`${title} · ${vertical?"Cinematic":"Editorial"}`,
  description:vertical?"Portrait, stacked cinematic presentation":"Landscape, balanced editorial presentation",
  layout:vertical?"cinematic":"editorial",
  aspectRatio:vertical?"9 / 16":"16 / 9"
 });
};
export const POST_TEMPLATES:readonly PostTemplate[]=Object.freeze(
 COMBINATIONS.flatMap(types=>(["horizontal","vertical"] as const).map(orientation=>buildTemplate(types,orientation)))
);
export const DEFAULT_POST_ORIENTATION:PostOrientation="vertical";
export function getPostContentTypes(input:{
 text?:string|null;
 quran?:boolean|null;
 image?:boolean|null;
 video?:boolean|null;
}):PostContentType[]{
 return POST_CONTENT_TYPES.filter(type=>{
  if(type==="text")return Boolean(input.text?.trim());
  return Boolean(input[type]);
 });
}
export function getTemplatesForContent(types:readonly PostContentType[]):readonly PostTemplate[]{
 const key=keyFor(types);
 return POST_TEMPLATES.filter(template=>template.combination===key);
}
export function getPostTemplate(id:string|null|undefined):PostTemplate|undefined{
 return POST_TEMPLATES.find(template=>template.id===id);
}
export function resolvePostTemplate(types:readonly PostContentType[],requestedId?:string|null):PostTemplate|undefined{
 const candidates=getTemplatesForContent(types);
 return candidates.find(template=>template.id===requestedId)
  ??candidates.find(template=>template.orientation===DEFAULT_POST_ORIENTATION);
}
export type PostPresentationMetadata = Readonly<{
 post_style:PostTemplateId;
 orientation:PostOrientation;
 content_types:readonly PostContentType[];
 template_version:PostTemplateVersion;
}>;
export function makePostPresentationMetadata(template:PostTemplate):PostPresentationMetadata{
 return {post_style:template.id,orientation:template.orientation,
  content_types:[...template.contentTypes],template_version:1};
}
/** Existing posts with no valid template should keep the legacy gallery renderer. */
export function readPostPresentationMetadata(value:unknown):PostPresentationMetadata|null{
 if(!value||typeof value!=="object")return null;
 const obj=value as Record<string,unknown>;
 if(obj.template_version!==1||typeof obj.post_style!=="string")return null;
 const template=getPostTemplate(obj.post_style);
 if(!template||obj.orientation!==template.orientation||
  !Array.isArray(obj.content_types)||
  keyFor(obj.content_types.filter((type):type is PostContentType=>typeof type==="string"&&POST_CONTENT_TYPES.some(t=>t===type)))!==template.combination)return null;
 return makePostPresentationMetadata(template);
}
