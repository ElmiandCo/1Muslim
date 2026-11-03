# Bot B — Female avatar production pack (2026-11-03)

**Status:** Production-ready generator prompts and pairing QA contract; **no raster images generated or uploaded**. No generator credentials or image-output-to-GitHub pipeline verified. This PR is a handoff, not a completed avatar batch.

## Shared master prompt
Create a premium, futuristic, modest **female-presenting hijabi** 1Muslim avatar, square 1024×1024 PNG, isolated on perfectly pure black (#000000), straight-on centered symmetrical head-and-shoulders bust, eye-level 85mm portrait framing. Absolutely **faceless**: seamless smooth blank reflective faceplate with no eyes, nose, mouth, skin, eyebrows or face details. Sophisticated material detail, tailored hijab covering hair, neck and shoulders, no exposed hair, modest attire. Top of head/helmet at 12% canvas height, centerline at 50%, chin/faceplate lower edge near 65%, shoulders start at 75%, broadest silhouette 78–84% canvas width. Leave at least 10% top negative space and 8–11% side margins. The exact same crop, shoulder height, faceplate dimensions, camera, focal length, studio key lighting direction and black background across every theme. Materials and palettes change to match the theme; **do not make every avatar silver**. No UI frame, circle, text, logos, labels, particles, props floating outside the silhouette or environment. Premium realistic CGI, not a human photograph.

## Negative prompt
human face, eyes, nose, mouth, lips, skin, exposed hair, exposed neck, low-cut clothes, face texture, smile, facial expression, photoreal person, tilted head, asymmetrical shoulders, three-quarter view, different crop, camera zoom, tiny portrait, oversized head, cut-off helmet, bright background, gradients behind subject, scenery, text, logo, watermark, border, ornamental ring, all-silver-only palette.

## Theme prompts
Use the master prompt verbatim and append exactly one theme extension:

1. **Astronaut** — Premium pearl-ceramic and titanium space suit, deep navy and icy-blue panels, integrated modest hijab beneath a sleek futuristic helmet collar; faceless visor stays blank and smooth; restrained blue reflections, subtle space-grade hardware.
2. **Doctor** — Refined ivory clinical coat with tailored modest hijab and polished white/teal medical tunic, tasteful medical instrument motifs integrated into garment seams; blank porcelain-metal faceplate; soft clinical teal highlights.
3. **Scientist** — Precision laboratory coat and modest technical hijab, graphite/ivory with violet/cyan instrumentation trim, elegant transparent protective collar but no transparent face; blank reflective faceplate; restrained lab lighting.
4. **Engineer** — Structured graphite and copper precision-engineering jacket with modest hijab, brushed steel fasteners and subtle gold/copper technical seams, featureless dark-metal faceplate; no tools obscuring portrait.
5. **Pilot** — Elegant midnight-sapphire aviation uniform, structured modest hijab, tailored silver aviation trim and sleek flight collar, blank reflective metallic faceplate; subtle cool blue reflections.

## Pairing workflow and acceptance
- FIRST inspect Bot A's corresponding male output, metadata and PR. If unavailable, use the locked shared geometry as provisional, and flag paired alignment as **unverified**.
- Render each female theme at 1024×1024, fixed seed/camera if the generator supports it; use identical base prompt and geometry.
- Export lossless PNG named `avatar-astronaut-female.png`, `avatar-doctor-female.png`, `avatar-scientist-female.png`, `avatar-engineer-female.png`, `avatar-pilot-female.png`.
- Record per-image width, height, top-head y, faceplate-bottom y, shoulder-start y, silhouette x-min/x-max, generator name/version, seed, prompt revision and file hash in a manifest.
- Reject any image with facial features, hair exposure, inconsistent framing, colored background or off-center head. Compare Bot A/B side-by-side and crossfade at 200–400 ms; reject head/shoulder jumps greater than 2% of canvas dimension.
- Do not overwrite existing images, modify production avatar references, or merge without review.

## Blocker and integration
No image-generation service credentials, model endpoint, or image artifact upload path has been validated in this Codex/GitHub execution context. The GitHub connector can commit UTF-8 prompt documents but does not generate image pixels. Next: invoke an authorized image generator with these prompts, obtain 1024px PNG outputs, validate metadata/framing, then commit the images and manifest on this branch; compare to Bot A's output before marking complete.
