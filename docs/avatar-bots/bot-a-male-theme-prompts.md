# Avatar Bot A — Male themed portrait generation pack

## Status and generator blocker
This branch contains a complete, ready-to-run image-generation prompt pack, **not generated PNG images**. The GitHub connector can commit text files, but no connected image-generation-to-GitHub binary asset pipeline was verified. A renderer must run the prompts, export 1024×1024 PNGs, and commit them to the avatar asset directory after visual QA. Do not mislabel prompts or placeholder SVGs as completed artwork.

## Shared composition contract for Bot B
Use exactly the same base portrait framing for both male and female counterparts:
- Square 1024×1024, pure black (#000000) background.
- Camera directly frontal, eye level, medium bust, zero roll or yaw; symmetrical shoulders.
- Top of head at y=123 px (acceptable 102–143), face center x=512 (±20 px).
- Bottom of featureless faceplate near y=666 px (±20); shoulders begin y=768 px (±30).
- Maximum silhouette width 800–860 px, centered; top negative space ≥102 px, sides ≥82 px.
- Smooth blank metallic or ceramic faceplate without eyes, nose, mouth, skin, facial anatomy, text, logos, rings, scenery.
- Crisp high-end 3D product portrait, controlled studio key from upper left, soft cool fill from right, subtle edge separation, black background. Preserve head/neck scale across all five themes.
- All theme palettes are **different**. The old silver samples are a composition reference, **not** an all-silver instruction.
- Avoid metallic human facial features; male silhouettes may incorporate a kufi where it fits theme design.
- No painted border in the image; the app supplies framing.
- Female counterpart: keep all numerical coordinates, camera, illumination, material treatment and thematic motifs, change only gender presentation and modest hijab/helmet silhouette.

## Universal prompt prefix
"Create a single 1024×1024 premium 3D product portrait of a faceless male Muslim-themed character. Absolute black background. Straight-on symmetrical medium-bust framing, head top at 12% image height, face center at 50% width, faceplate ending around 65% height, shoulders beginning around 75%, side margins 8–11%. Featureless smooth faceplate with absolutely no eyes, nose, mouth, ears or visible skin. Studio-quality realistic material rendering, finely crafted clothing, restrained cinematic lighting, extremely clean silhouette. No writing, logos, emblems, interface frame, environment, props outside bust, halo or floating particles. Maintain identical framing across the collection."

## Theme prompts (append to universal prefix)
1. **Astronaut** — Futuristic orbital explorer with white ceramic and titanium pressure suit, navy/deep-space-blue panels, intricate silver seals and a sleek helmet framing a completely blank mirror visor. Premium precision hardware, restrained icy-blue rim reflections. No NASA or other marks. Output: `avatar-astronaut-male.png`.
2. **Doctor** — Elegant futuristic physician wearing a structured ivory-white medical coat, teal piping, understated surgical-grade titanium collar and blank pearlescent faceplate. Polished clinical finish, soft teal highlights, dignified and modest. No medical symbols or lettering. Output: `avatar-doctor-male.png`.
3. **Scientist** — Advanced laboratory researcher in graphite and ivory lab jacket with violet/cyan micro-reflective panels, delicate glass-like instrument detailing on the collar, smooth faceless polished ceramic visor. Sophisticated but understated, not a sci-fi soldier. Output: `avatar-scientist-male.png`.
4. **Engineer** — Precision engineer in graphite carbon-fiber technical jacket with warm copper and muted gold seams, engineered shoulder panels and a seamless dark-titanium featureless visor. Functional refined industrial design, not armor or weaponry. Output: `avatar-engineer-male.png`.
5. **Pilot** — Luxury aviation pilot with deep sapphire and charcoal flight jacket, precision silver trim, elegant helmet/cap-inspired head silhouette and a perfectly smooth opaque faceplate. High-end aviation craftsmanship, no airline logo or rank text. Output: `avatar-pilot-male.png`.

## Negative prompt
"human face, eyes, eyebrows, eyelashes, nose, mouth, lips, beard, skin, ears, visible hair, realistic human head, asymmetry, three-quarter view, tilted camera, cropped helmet, busy background, gradient backdrop, text, watermark, logo, flags, halo, circular UI border, extra arms, hands near face, toy proportions, low resolution, plastic cartoon rendering, oversaturated neon, same silver outfit for all themes"

## Acceptance / crossfade QA
- Render each portrait at 1024² and inspect subject bounding boxes before committing.
- Compare male/female pairs in 300 ms and 600 ms opacity crossfades at fixed container size; no positional jumps >20 px at head top or centerline.
- Reject exposed facial anatomy, colored/gradient background, crop/scale inconsistency, excessive glow, or a uniformly silver collection.
- Commit assets and a manifest with actual dimensions, crop coordinates, generator name/model, seed if available, and QA evidence. Never invent QA results.

## Bot B handoff
Use this exact numerical framing and the five theme palette briefs for the matching female hijabi/helmet silhouettes. Reference branch `bot-a/avatar-themes-male-20261103` and this file. No production deployment or asset replacement until both sets are generated and reviewed.
