import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("featured HudHud verse keeps Arabic and translation in separate centered rows",()=>{
 const component=read("app/components/HudHudVerseCard.tsx");
 const css=read("app/components/hudhud-verse-presentation.css");
 assert.match(component,/className=\{featured\?"hudVerseAccessLabel":"hudMatchKind"\}/);
 assert.match(component,/<strong className="hudVerseArabic" lang="ar" dir="rtl">\{loaded\.arabic\}/);
 assert.match(component,/<p className="hudVerseEnglish" lang="en">/);
 assert.match(component,/hudVerseTranslationCredit/);
 assert.match(css,/\.hudVerseCard\.hudVerseHero>\.hudVerseAccessLabel/);
 assert.match(css,/clip:rect\(0,0,0,0\)!important/);
 assert.match(css,/\.hudVerseHero>\.hudVerseArabic\{[\s\S]*text-align:center!important/);
 assert.match(css,/\.hudVerseHero>\.hudVerseEnglish\{[\s\S]*text-align:center!important/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test("verse references and translator attribution stay accessible, never synthesized",()=>{
 const component=read("app/components/HudHudVerseCard.tsx");
 assert.match(component,/THE QUR’AN · \{verseKey\}/);
 assert.match(component,/English translation: \{loaded\.translation\}/);
 assert.match(component,/\/api\/hudhud\/verse\?key=/);
 assert.match(component,/href=\{href\}/);
 assert.doesNotMatch(component,/innerHTML|dangerouslySetInnerHTML/);
});
