# 1Muslim Automatic Production Delivery

Production lives on the `main` branch of `ElmiandCo/1Muslim`, which Vercel deploys through its Git connection.

## Default low-risk change flow
1. Open a same-repository pull request into `main`. Code changes are previewed on Vercel.
2. Keep PR **draft** until it is ready for delivery. The `Validate TypeScript and Build` workflow reruns when the PR is marked ready.
3. `verified-production-auto-merge.yml` checks the exact PR HEAD for successful CI and the Vercel commit status for a ready preview.
4. The PR must not be behind `main`, blocked, in conflict, or carry a hold label.
5. Once eligible, the workflow merges the PR to `main`. Vercel builds a **new production deployment** from that commit. Production is not reported ready until the deployment is ready.

## Extra safety
- Database migrations always require manual release coordination.
- Authentication, payments, backend API, privileged/admin and other sensitive changes require a `production-reviewed` label in addition to the checks.
- Full release-branch integrations also require `production-reviewed` and a verified combined candidate. A successful sub-feature preview is not enough to release the whole train.
- `release-hold`, `needs-integration`, `security-review`, or `do-not-deploy` always prevent automated merge.
- If a post-deployment smoke check fails, investigate and roll back using Vercel's production rollback, then repair and validate before a new attempt.

## Verification
This document also serves as the low-risk, documentation-only PR used to smoke-test the owner-authorized production gate on 2026-11-26. No app behavior, credentials, migrations, or pricing are changed.
