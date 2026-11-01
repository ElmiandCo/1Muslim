import assert from "node:assert/strict";
import test from "node:test";
import {getYouTubeId,extractVerse} from "../lib/community-post-content.ts";

const id="dQw4w9WgXcQ";
test("YouTube watch, shorts, live and short links resolve to one video ID",()=>{
 assert.equal(getYouTubeId("https://www.youtube.com/watch?v="+id),id);
 assert.equal(getYouTubeId("https://youtu.be/"+id),id);
 assert.equal(getYouTubeId("https://youtube.com/shorts/"+id),id);
 assert.equal(getYouTubeId("https://m.youtube.com/live/"+id),id);
});
test("unsafe, unrelated and malformed YouTube URLs never become embeds",()=>{
 assert.equal(getYouTubeId("https://youtube.com.evil.example/watch?v="+id),null);
 assert.equal(getYouTubeId("https://www.youtube.com/watch?v=too-short"),null);
 assert.equal(getYouTubeId("javascript:alert(1)"),null);
 assert.equal(getYouTubeId("No video in this reflection"),null);
});
test("Qur'an Arabic, translation and reference are extracted without dropping reflection",()=>{
 const verse=extractVerse("My reflection\n\nQur’an 94:6\n\nإِنَّ مَعَ الْعُسْرِ يُسْرًا\n\nIndeed, with hardship comes ease.");
 assert.ok(verse);
 assert.equal(verse.reference,"Qur’an 94:6");
 assert.match(verse.arabic,/مَعَ/);
 assert.match(verse.english,/hardship/);
 assert.equal(verse.remaining,"My reflection");
});
test("ordinary text and reference without verse text remain normal posts",()=>{
 assert.equal(extractVerse("Remember Allah today."),null);
 assert.equal(extractVerse("Qur’an 94:6"),null);
});
