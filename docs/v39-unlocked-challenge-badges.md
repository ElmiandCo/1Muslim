# Unlocked challenge badge integration contract

`GET /api/unlocked/challenge-badges` is an authenticated, owner-scoped,
uncached, read-only snapshot. Existing `profile_badges` are returned regardless
of subscription state. Reader initiation, Al-Fatiha and Ayat al-Kursi remain
ineligible: no badge key is assigned and no XP or badge is written. The endpoint
does not accept a user ID, progress, event, or claim in the request.

`quran_reading_events` permits authenticated owner inserts, and the verse-view
XP functions let the client start and claim a timer for a supplied verse. Neither
proves the agreed reading/playback completion or a verified Reader initiation.
The subscription table holds the current state, not entitlement history, so it
also cannot establish membership at an earlier event. A current active/trialing
row alone must never unlock a historical completion.

Before automatic awards, agree on trustworthy event definitions and badge keys
with the Qur'an and profile workstreams; record entitlement at the actual event;
and implement an authenticated, server-authoritative atomic award and audit
path. The existing unique `(user_id, badge_key)` contract supports idempotency.
Coordinate subscription status and webhook ordering with the Stripe workstream.
Existing earned badges must not be deleted when entitlement ends. This endpoint
does not establish Shahada verification or change its existing flow.
