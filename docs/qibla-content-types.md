# 1Muslim content classification and publishing

All content lives in the **same Supabase project**, but existing workflows use separate purpose-built tables. Do not merge editorial articles into the public feed table or bypass editorial approvals.

| Content | User-facing name | Current storage | Workflow |
| --- | --- | --- | --- |
| Community / Ummah feed | **Public Post** | `ummah_feed_posts`, optional `posts` + `post_media` | Publish to public feed immediately (subject to moderation). |
| Qibla Magazine | **Magazine Article** | `qibla_submissions` (`kind=magazine`) → `qibla_pages` | Writer/editor submission, review, approval, publish. |
| Qibla Newsletter | **Newsletter Article** | `qibla_submissions` (`kind=newsletter`) → `qibla_pages` | Writer/editor submission, review, approval, publish. |
| Legacy newsletter articles | **Newsletter Article** | `newsletter_articles` | Preserve existing historical content; do not silently migrate. |

Canonical UI/content labels: **Public Post**, **Magazine Article**, **Newsletter Article**. All are content, but an article is never treated as a public post without an explicit cross-publish action.

Media publishing fix: `posts.body` historically had a 1,000-character CHECK while `ummah_feed_posts.body` permits 2,000. Migration aligns both to 2,000; API now logs the database code and details on server, while showing a safe message to users. Verify photo and video publishing on preview and actual authenticated accounts; check XP trigger and post_media insert if errors persist.

Future consolidation should introduce a shared content index with `content_kind` (`public_post`, `magazine_article`, `newsletter_article`) and `source_id`, preserving source tables, permissions and editorial approval; do not migrate existing rows until reviewed.
