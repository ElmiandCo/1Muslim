# Bismillah — 1Muslim v3.9 AI Engineering Operating Principles

## Owner-approved continuous production delivery (2026-11-26)
The owner now authorizes **automatic production deployment of completed, validated changes** without asking again each time. Vercel's Git integration deploys merged `main` commits; `.github/workflows/verified-production-auto-merge.yml` merges eligible, non-draft, same-repository PRs targeting `main` only after exact-head CI and Vercel preview success and a current base. Keep ordinary low-risk UI PRs small and mark them ready after reviewable verification, so the automated gate can finish the job. Never promote preview builds directly as production.

Do not bypass protections: database migrations are not auto-merged; sensitive auth, payments, admin, API, security, workflow, or release-integration changes require an explicit `production-reviewed` label, in addition to green checks; `release-hold`, `security-review`, `needs-integration` and `do-not-deploy` always block auto delivery. The system must not silently merge a draft, merge conflicting branches, or publish while checks are pending. For work staged on `release/v3.9`, create a tested integration PR into `main`; do not deploy the entire branch merely because one feature passed. Verify production READY and conduct smoke checks, alert/fix/rollback on failure. The former prohibition on automated merges is superseded **only under these defined gates**.

**MASTER MISSION:** https://github.com/ElmiandCo/1Muslim/issues/1592  
**COORDINATION:** https://github.com/ElmiandCo/1Muslim/issues/1593  
**BOT ISSUES:** #1593–#1606.

## With the right intention
Begin the first handoff message of each v3.9 assignment with **"Bismillah."** The founder's objective is to serve the Ummah with sincerity, technical excellence and respect: welcome Muslims and seekers, connect people, deepen Qur'an learning, teach Salah reliably, create a meaningful Live community and treat every person with dignity. A beautiful interface is insufficient if the content, performance, permissions or backend is wrong. Be creative, responsible, resource-efficient and honest. Do not manufacture progress or suppress known defects.

## Before touching code
1. Read the assigned GitHub issue completely, and the latest owner-approved addenda on #1592. For v3.9 bot changes, build from `release/v3.9`, not dated screenshots or branches; inspect `main` only for shipped baseline context. Inspect existing code and recent merged PRs, preserving verified behavior.
2. Find and reuse real 1Muslim motion/layout, auth, Supabase, LiveKit, Stripe and messaging components rather than a conflicting replacement implementation.
3. Respect the file/contract ownership of adjacent v3.9 workstreams. If a shared component must change, document the cross-team interface first; avoid undoing another feature.
4. Ship in small reviewable **draft** PRs with tests, no destructive migration. Only mark ready after CI + iOS/desktop + permission smoke passes and integration approval. Do not unilaterally merge into `main`.
5. Keep existing operational site working, no fake /tmp placeholders in user flows, no new privileged writes without server-side authorization, no browser-visible credentials.

## Release-train conflict reconciliation — proactive, no owner nudge required
- Before every new scoped bot change, compare all existing open draft PR changed-file lists targeting `release/v3.9` (or the current release branch). An open/completed PR for the assigned issue is a stop condition: do not launch duplicate coding runs.
- Distinguish **literal file overlap** from a **cross-component integration dependency**. For example, `app/profile/page.tsx` and `ProfileCinematicOverlay.tsx` may require combined regression QA even when they do not create a Git merge conflict. Never claim a merge conflict merely because features share a page.
- The integrator owns proactive reconciliation: record file ownership, inspect BOTH real diffs, make a small integrated candidate or workstream rebasing plan, and validate the combined behavior before any feature is staged. Where a change is provably non-conflicting, proceed with non-destructive integration review without waiting for the owner to prompt. Where behavior, privacy or security differs, leave drafts open and flag the precise blocker; do not silently choose one implementation.
- Rerun targeted tests for all touched features, plus TypeScript/build and applicable iOS Safari, auth, map opt-in, Qur’an source, Live permissions, billing and Vercel preview checks. A green standalone PR is not proof that the combined release passes.
- One coding agent maximum at a time, cost-effective model first, and no repeated `/v39-run` for an active or completed issue. Do not auto-start a second agent to reconcile a first agent's work. Never auto-merge to `main` or send a release DM before one integrated release PR passes all gates and production smoke.
- Automated release PR guard may flag overlapping files or linked profile components; treat it as a cue to reconcile, not as proof of production readiness. Report meaningful findings directly on the relevant GitHub PRs and keep the master mission informed.

## Experience
Native-feel mobile and desktop, smooth 60fps where supported, original responsive magnetic card/deck physics, quiet theme-sensitive glass, readable Arabic, nonblocking HUDs, prefetch by intent not blanket loading. Reduced-motion and low-bandwidth fallbacks are mandatory. Never show blue interstitial flashes, orphan full-screen loaders, overlapping fixed chrome or dead controls.

## Faith and privacy
Do not invent or modify Qur'anic text, tashkīl, Tafsir or Qirā’āt from a model guess; test against an authoritative cited, licensed source. Keep Shahada audio and identity protected; request location only when needed with informed consent, and never treat refusal as a risk signal. No member identities/precise locations on a public map without granular opt-in. Privileged HudHud account operations must verify admin authorization and seek explicit confirmation for destructive actions. Mic permissions need clear indicators and a real off switch.

## What v3.9 must include
- Guest landing, compact sign-in / reset, HudHud Shahada onboarding, profile reveal and id recovery.
- 12-tile Explore grid, smooth cache-backed nav and performance optimizations.
- Live foreground camera, translucent controls, guest approval, comments, screen share, mini-player.
- Magnetic stacked Ummah cards with delayed/elastic comments plane and graceful velocity-based dismissals.
- Cinematic profiles, draggable snap-on-side avatar, badge integrity and Spotlight.
- Qur'an font/marks, actual reflowing pinch zoom, verified word audio, Tajweed/Tafsir/Qirā’āt from trustworthy sources.
- Salah Academy with retained educational text, precise 11-step (or actual source count) guided flow.
- DeepWatch contextual profile cinema and opt-in co-watch overlays.
- An immersive borderless member map with privacy-safe clustering and messaging.
- HudHud Command Center conversational visual queries and controlled full-duplex voice, admin-only two-bubble launcher.
- Admin-only one-per-release AI DMs after verified production READY + smoke, clear version and rollback state.
- 1Muslim Unlocked final three prices: **$5.99/week; $9.99/month; $35/year**. Yearly savings = **$84.88 / 71%** vs 12 monthly payments. Owner supplies Vercel Stripe price IDs **after code reaches production**; gracefully disable new checkout until configured. Never change an existing subscriber's $3.99 contract or start charging without Stripe verification. Free Live remains free.

## End-of-task proof
Report code paths, commits/PR, tests and measured outcomes, screenshot/clip where UI, security/permission checks, real device/simulator limitations, potential regressions, deployment status and any external credentials missing. Exactly one concise honest admin DM once production is truly verified; never fake a deployment success.

**No excuses means solve problems, not skip safeguards. Insha'Allah.**
