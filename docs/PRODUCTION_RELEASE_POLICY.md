# 1Muslim production release policy

Production is NOT a development sandbox.

## Mandatory gates
1. Create a release candidate from a consolidated branch, never assume any single feature branch includes all work.
2. Verify homepage, mobile layout, Live player, Qur'an Studio, posting/likes, Arabic Academy, Profile Widget and Gold/Water avatar selection.
3. Require passing GitHub Actions checks and a successful Vercel preview deployment.
4. Obtain explicit owner approval for the exact deployment SHA before promoting to production.
5. Record deployment SHA, preview URL, production URL and release checklist in the PR.
6. Smoke test production immediately after promotion. If checks fail, use the last verified known-good deployment, not an arbitrary older commit.

## Repository settings to enable manually
GitHub Settings > Branches/Rulesets: protect main, require PR, require passing checks, block force pushes and deletions, require approval, restrict bypass and direct pushes. Verify that rules apply to administrators.
Vercel: configure production branch and deployment protection, prevent unreviewed auto-promotion, and use deployment approvals if available.

## Data safety
Never use a frontend animation as proof of persistence. Test database writes, reload state and real-time updates.
Never ship a database migration without rollback/recovery planning.
