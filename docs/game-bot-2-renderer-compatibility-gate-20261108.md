# Bot 2 — renderer compatibility and playability gate (2026-11-08 06:41 CST)

## Verified on branch
Inspected `app/components/SharedGameLobby.tsx` (lines 1–125). `makeRenderer` obtains a WebGL1 context with `powerPreference:"low-power"`, compiles a position/normal shader with one directional diffuse term, uploads one 24-vertex cube mesh (36 indexed triangles), and exposes `draw(vp,x,y,z,sx,sy,sz,col,alpha,angle)`. No bone attributes, joint matrices, skin weights, UVs, texture samplers or glTF loader exist in this inspected renderer section. Existing player state includes position, yaw, flight, boost, suit and peer identity. Preserve those as authoritative gameplay state.

The six picker labels are Jurassic, Time of Moses, Time of Jesus, Time of Muhammad ﷺ, Today, Future. Jurassic and Future scene modules are imported. Picker/import presence is not a world-playability test.

## Concrete compatibility blocker
Do **not** pass a GLB into the existing cube draw function: it cannot render skinned mesh primitives. A safe upgrade requires a distinct GLB renderer or an adapter that parses mesh buffers, indices, node hierarchy, skins/inverse bind matrices, animation samplers and PBR textures. WebGL1 support must be considered (joint uniform limits, index extension, shader variants, texture limits), with a runtime fallback to current procedural player.

## Implementation acceptance gates
1. Create feature flag default OFF; preserve old draw path and collision coordinates. On asset fetch, decode, shader, or context failure, restore old player without breaking controls.
2. Reuse PR #775 asset metadata/license/LOD contract and review PR #796 bounded streaming/cancellation before integrating. Require actual licensed GLB and known skeleton/clip names.
3. Keep player position, yaw, flight and combat state owned by current game logic. Drive animation from movement state only. Do not let animation root motion move the collision body.
4. Render rigged local and remote avatars in all six picker modes, including low-end WebGL1 fallback; verify depth ordering, shadows and skin palette limits.
5. Bot 3: measure paired old/new movement speed, jump arc, landing, foot clearance, combat aim, flight, orbit camera, touch gestures, multiplayer sync and 60-second FPS/frame-time on desktop and mobile. Log actual browser/device, failures and video/screenshots.
6. Bot 1: diff historical Jurassic, Moses, Roman Judea/Jesus, Nabawi/Muhammad, Today and Future branches against the unified branch. Preserve unique scene and mission assets; no wholesale overwrite.

## Evidence matrix — do not confuse evidence coverage with completion
| World | Historical evidence coverage (estimate) | Integrated gameplay % | Hands-on test |
|---|---:|---|---|
| Jurassic | 25% | unknown | unverified |
| Moses | 10% | unknown | unverified |
| Jesus | 10% | unknown | unverified |
| Muhammad ﷺ | 10% | unknown | unverified |
| Today | 10% | unknown | unverified |
| Future | 30% | unknown | unverified |

Graphics rough implementation evidence: primitive mesh detailing 10%; skinned mesh 0%; rig 0%; PBR textures 0%; procedural animation 10%; skeletal animation 0%; basic directional lighting 10%. Physics percentage unknown; overall completion unknown; gameplay-test readiness unverified. These are not completion percentages. No production merge authorized.

Historical references: https://github.com/ElmiandCo/1Muslim/pull/119 ; https://github.com/ElmiandCo/1Muslim/pull/129 ; https://github.com/ElmiandCo/1Muslim/pull/775 ; https://github.com/ElmiandCo/1Muslim/pull/796 .
