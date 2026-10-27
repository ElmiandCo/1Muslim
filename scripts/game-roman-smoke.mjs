// Static game integration regression checks; full browser/physics testing is separate.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const lobby=readFileSync("app/components/SharedGameLobby.tsx","utf8");
const scene=readFileSync("app/components/RomanJudeaScene.ts","utf8");
const checks=[
 ["Roman selector connected",lobby.includes('w==="Time of Jesus")enterRomanWorld()')],
 ["Roman renderer connected",lobby.includes("renderRomanJudea(vp,draw,now,p")],
 ["Bot A broadphase reused",scene.includes("buildStaticGameCollisionIndex")&&lobby.includes("romanJudeaCollisionIndex")],
 ["World bounds isolated",lobby.includes("romanWorldRef.current?ROMAN_BOUNDS")],
 ["Rome portal reachable",scene.includes("z:-90,radius:7")&&lobby.includes("travelRomanPortal();velocity=0")],
 ["Rome/Jerusalem UI",lobby.includes("Travel to ancient Rome")&&lobby.includes("Travel to Jerusalem")],
 ["Existing Moses scene preserved",lobby.includes("renderPartedSea(vp,draw")],
 ["Existing Jurassic preserved",lobby.includes("drawJurassic(")],
 ["Existing Future preserved",lobby.includes("renderFutureWorld(vp,draw")],
 ["Nabawi prayer preserved",lobby.includes("nearNabawi")&&lobby.includes("prayerPosture")],
 ["Belt Boyz Council preserved",lobby.includes("meetingSeatRef")&&lobby.includes("Council")],
 ["Old Roman architecture reused",scene.includes("Colosseum-inspired")&&scene.includes("Jerusalem: layered stone hills")],
 ["Olive groves added",scene.includes("for(let i=0;i<36;i++)")&&scene.includes("const sway=Math.sin")],
 ["LOD visual-only",scene.includes("if(Math.abs(x-player.x)>250+sx*.5")&&scene.includes("const jerusalemIndex=buildStaticGameCollisionIndex")],
 ["No prophets represented",!scene.includes("drawJesus")&&!scene.includes("drawProphet")],
];
for(const [label,ok] of checks){assert.ok(ok,label);console.log("PASS",label)}
// The original crossroads are unobstructed at the center portal and spawn.
const colliders=[];
for(let i=0;i<72;i++){const x=(i%9-4)*39,z=(Math.floor(i/9)-3.5)*48;if(Math.abs(x)<24||Math.abs(z)<24)continue;colliders.push({x,z,hx:12,hz:13});}
for(const side of [-1,1])colliders.push({x:side*235,z:0,hx:7,hz:220});
for(const z of [-220,220])for(let x=-230;x<=230;x+=14){if(Math.abs(x)<22)continue;colliders.push({x,z,hx:6,hz:6});}
for(let i=0;i<16;i++){const z=-165+i*22,x=(i%2?1:-1)*18;colliders.push({x,z,hx:3.5,hz:2});}
for(const z of [125,-90])assert.ok(!colliders.some(c=>Math.abs(c.x)<c.hx+.42&&Math.abs(z-c.z)<c.hz+.42),"Portal and spawn are physically clear");
console.log("PASS Roman portal and spawn collision clearance; 17 static checks total");
