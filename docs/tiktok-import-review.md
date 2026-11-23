# TikTok import reviewer walkthrough

Use a private HTTPS review environment with the TikTok app's Login Kit and Display API enabled. Add the consenting TikTok account as a sandbox test user and give it at least one public video it owns. Sign in to 1Muslim with the existing allowlisted reviewer account. Supply reviewer sign-in instructions privately through the review submission.

Set `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` on the server for that TikTok environment. Set `TIKTOK_REDIRECT_URI` to the exact HTTPS URL registered in Login Kit, including `/api/tiktok/callback`. Use the review environment's normal Supabase configuration, including `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`. Apply `20261123140000_tiktok_verified_share.sql` with the API update in the review environment. Publication fails closed if the API is deployed before the migration. Retain the RPC access restriction if rolling back the UI or API.

## Phone recording script

1. Open your 1Muslim profile and select **Connections → TikTok**. Show the review-only screen and explain that `user.info.basic` displays name and avatar and `video.list` retrieves the creator's public videos. Keep account and app credentials out of the recording.
2. Tap **Connect TikTok securely** and show the official consent screen. Grant both scopes with the sandbox test account. Show the return to the profile and the real avatar, display name and gallery. If the account is ineligible, check the sandbox test-user list.
3. Preview one video and read its duration. Use **Load more videos** if TikTok returns another page. Tap **Share to Ummah** and accept the single-video confirmation.
4. Open the Ummah feed and find the post under the reviewer's 1Muslim identity. Verify the linked TikTok account and video match the selection. Exercise playback and link fallback on iPhone Safari and desktop. Try sharing the same video again and confirm **Already shared to Ummah** with one feed post.
5. Open **Connection settings → Disconnect TikTok**, confirm the gallery clears, then reconnect. Keep any earlier reviewer recording.

## Review checks before submission

- Decline consent, retry with missing scopes, revoke authorization in TikTok and exercise expiry/refresh.
- Verify visitors and ordinary signed-in members cannot list or share, including via the Supabase RPC. Verify a video from a different account or a video made private after listing is rejected without creating a post.
- Confirm the scopes, callback and app/reviewer visibility in the TikTok portal. Basic scope supplies display name and avatar. The canonical link identifies the creator handle for each video.
- Capture phone and desktop screenshots and record the walkthrough against the actual review environment. Feed rendering and direct post links belong to the Ummah posts workstream (#1597). Coordinate profile entry with #1598, onboarding with #1594, and integrated verification with #1606.
