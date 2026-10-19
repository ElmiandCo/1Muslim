# 1Muslim Qur’an XP rules — approved 2026-10-19

## Awards (server-verified, idempotent)
- Reading an individual Qur’an verse: +250 XP per verified verse read. Do not award merely for rendering, scrolling past, or reloading the verse.
- Listening to an individual Qur’an verse: +500 XP when the verse audio completes while the listening session is eligible. Reading and listening are separate rewards.
- Reciting an individual verse into the in-page recorder: +2,500 XP for a sufficiently accurate ARABIC recitation. Use the existing Shahada audio/recognition technology as the integration foundation, adapted to match the selected verse’s Arabic text and reasonable pronunciation variations. English translation/transliteration never counts as the verification target. Recordings save automatically on qualifying recitation, with explicit microphone consent and applicable retention/privacy rules. Incorrect/uncertain matches should not award XP.
- Completing a Qur’an chapter: +10,000 XP in addition to eligible per-verse rewards. Chapter completion requires verifiable coverage of the chapter, not just jumping to the final ayah.
- All rewards require authenticated server-side validation, anti-replay/idempotency keys, fraud controls, atomic profile total/event updates, and Supabase RLS. Do not award repeatedly for the same qualifying action without an explicitly approved repeat policy. Do not trust client-supplied XP totals.

## Level-up celebration
- Use the member’s currently equipped avatar and its existing visual animation, a glowing/light border, animated XP total and level transition, and text “Keep Going”.
- Total celebration duration ~2 seconds, then fade out; respect reduced-motion preferences.
- Trigger on crossing INTO levels 2, 5, 10, 20, then every tenth level thereafter: 30, 40, 50, ...
- Do not celebrate every intermediate level. Handle multiple-level jumps by showing the highest crossed qualifying milestone once; never replay on page reload.
- The existing draggable XP widget remains the presentation component. Ordinary XP grants may show a short 1–2-second toast, while milestone transitions use the avatar celebration.

## Integration and acceptance
- Home Qur’an and full Studio share a single award service. Preserve the existing homepage design, HudHud navigation, continuous audio, chapter/overall progress, and existing avatar settings.
- Audio completion should award +500 once for the verse and advance playback if continuous mode is on. Pause, skip and muted/failed audio must not count as completed listening.
- Arabic recitation: recording → compare to target Arabic verse → save successful attempt automatically → +2,500 XP; handle errors and retries clearly. Never claim this is validated until real microphone/audio tests pass.
- A full chapter grants +10,000 once when every verse qualifies under chapter completion policy, even if its per-verse XP was previously awarded.
- Deploy only after verifying migration, RLS, recognition, audio completion, and XP level milestone logic. Keep production unchanged until validated.

## Automatic XP recording and UI notification — clarified
- Persist every validated XP grant automatically, without any manual claim or Save action from the user. Save a durable, unique XP event and update the user's XP total atomically on the server. After success, update the displayed XP and progress without reload.
- All ordinary level-ups show ONLY a subtle, draggable XP-widget notification for 1–2 seconds, then fade away. Do not interrupt reading, listening, recording, or navigation.
- Exceptional milestone level-ups entering levels **2, 5, 10, 20, 30, 40, 50, ...** use the full ~2-second avatar/glow/level/“Keep Going” celebration. The pattern is 1→2, 4→5, 9→10, 19→20, and every 10th level thereafter.
- A large XP award may cross several levels at once: award XP once, persist once, and show at most one milestone celebration for the highest qualifying threshold crossed. Ordinary level notifications must not stack or delay playback.
- Successful Arabic-recitation recording is saved automatically when verification passes; recording upload and XP grant must be linked to prevent double-awards.
- No toast or level celebration before server confirms the reward; don't replay already-consumed notifications on refresh or on a second device.
