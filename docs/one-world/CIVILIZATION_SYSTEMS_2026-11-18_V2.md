# Civilization Systems — second vertical slice
Added isolated pure TypeScript ledger and rules engine at lib/one-world/ledger-core.ts with node:test cases. Includes terrain yields, building and unit catalogs, tech prerequisites, land purchases, repair debits, idempotency replay, peaceful immunity, raid cooldown and defender-first flag. No production database, authentication, wallet, or battle route touched. No migration.
## Security boundary
This pure function is NOT sufficient for server security: transaction caller must authenticate user, authorize plot, lock wallet and plot rows, validate idempotency key uniqueness in database, and commit ledger and changes in one database transaction. No automatic battle XP deduction. Conquest relocation requires server allocation and atomic transfer. The raid cooldown and first-strike rules are predicates only, not real-time combat.
## Handoff
World Architect/Visual Studio: wire only demo state into isometric UI. Integration QA: test via Node TS-capable runner, review existing branches before merge; design Supabase RPC with row locks, unique ledger keys and RLS before enabling real XP. Shared docs on other PR branches were not present on main at this run; avoid conflicting edits there.
## Tests
Eight node:test cases committed, execution not verified in this environment.
