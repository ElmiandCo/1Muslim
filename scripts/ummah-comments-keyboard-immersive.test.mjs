import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("comment modal uses compact, separated touch controls instead of stacked dark pills",()=>{
 const component=read("app/components/UnifiedPostMedia.tsx");
 const css=read("app/ummah-conversation-polish.css");
 assert.match(component,/className="commentActions"/);
 assert.doesNotMatch(component,/className="commentActions" style=\{\{/);
 assert.match(css,/\.ummahCommentPortal \.commentActions\{/);
 assert.match(css,/flex-flow:row nowrap!important/);
 assert.match(css,/\.ummahCommentPortal \.commentActions>button\.replyAction/);
 assert.match(css,/margin-right:auto!important/);
 assert.match(css,/min-width:40px!important/);
 assert.match(css,/\.ummahCommentPortal \.viewReplies/);
});

test("keyboard expands comment sheet and keeps composer above the iOS keyboard",()=>{
 const component=read("app/components/UnifiedPostMedia.tsx");
 const css=read("app/ummah-conversation-polish.css");
 assert.match(component,/window\.visualViewport/);
 assert.match(component,/viewport\.offsetTop-viewport\.height/);
 assert.match(component,/body\.style\.position="fixed"/);
 assert.match(component,/window\.scrollTo\(0,scrollY\)/);
 assert.match(component,/onFocusCapture=\{e=>/);
 assert.match(component,/setSheetExpanded\(true\)/);
 assert.match(component,/bottom:keyboardInset/);
 assert.match(component,/env\(safe-area-inset-top, 0px\)/);
 assert.match(css,/\.ummahCommentPortal\.ummahKeyboardActive \.commentComposer/);
 assert.match(css,/\.ummahCommentPortal \.commentComposer \[contenteditable="true"\]/);
});

test("immersive post keeps its existing smooth draggable sheet with keyboard-safe dark and day presentation",()=>{
 const story=read("app/posts/story/[id]/page.tsx");
 const unified=read("app/components/UnifiedPostMedia.tsx");
 const css=read("app/ummah-conversation-polish.css");
 const layout=read("app/layout.tsx");
 assert.match(story,/className="immersiveSheetHandle" role="slider"/);
 assert.match(story,/setPointerCapture\(e\.pointerId\)/);
 assert.match(story,/\.immersiveStory:has\(\.immersiveSheet\.isDragging\)/);
 assert.match(story,/window\.visualViewport/);
 assert.match(story,/--imm-visual-height/);
 assert.match(story,/onFocusCapture=\{e=>onComposerFocus\(e\.target\)\}/);
 assert.match(story,/focusCommentId=\{focusCommentId\} immersiveMode/);
 assert.match(unified,/\(sheetMode\|\|immersiveMode\)&&<div className="ummahEmojiRow"/);
 assert.match(css,/html\[data-one-chrome="night"\]/);
 assert.match(css,/html body main\.immersiveStoryPage/);
 assert.match(layout,/import "\.\/ummah-conversation-polish\.css"/);
});
