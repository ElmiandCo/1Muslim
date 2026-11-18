# ONE WORLD — Civilization Systems Design

## Current vertical slice
Pure TypeScript prototype simulation in `lib/one-world/civilization.ts` and Node test harness. No DB writes, API routes, schema changes, XP wallet integration, or UI changes. This is deliberately separate from Visual Studio's map components.

## Progression
Eras: settlement → agriculture → education → industry → aviation. Buildings: home, garden, farm, stable, school, library, theater, laboratory, base, airport. Units: horse, car, tank, jet, with building, era, and resource prerequisites. Terrain harvesting: meadow food, forest wood, farmland food, hills stone, river food. Farms increase food; education adds knowledge; laboratories add knowledge/fuel.

## Economy safety contract
XP belongs to the existing 1Muslim wallet, but production integration MUST use authenticated server-side transactions. A purchase is one atomic database operation: verify auth.uid, ownership, price, resources, nonnegative wallet balance, insert immutable ledger row with unique idempotency key, then update state and commit. Never accept user-supplied prices, balances, attack results, or resource amounts. Avoid migrations until DB schema and auth integration are reviewed. The prototype uses a local immutable ledger solely for simulation. Combat damage changes durability, NOT wallet XP. Repairs are explicit opt-in purchases.

## Peace and conquest
Peaceful users cannot attack or be attacked. Conquest requires both participants in conquest mode. Attacks use defender-first-strike advantage for repeated attacks within 24 hours and 10-minute plot protection cooldown. Offline defense must eventually use server-calculated troop/building state; the prototype uses a simple fixed defense score. On conquest, transfer plot ownership and apply a safe relocation workflow to displaced residents BEFORE production deployment. Avoid griefing: add defender recovery, anti-abuse limits and audit events.

## Next integration tasks
1. Connect player state and plot IDs to server-authoritative Supabase tables behind RLS.
2. Build a transaction RPC with idempotency and ledger audit.
3. Add explicit build/harvest/repair UI controls to the isometric game map.
4. Implement movement, animal husbandry, troops and battle resolution with secure server-side logic.
5. Add conquest relocation and cooldown enforcement in DB, not only UI.
6. Add integration tests and load tests; protect production data.

## Testing
Run `node --test lib/one-world/civilization.test.mjs` with installed `typescript` dependency. Tests cover purchases, ledger, ownership, peace protection, repeat raids, durability, voluntary repairs and harvesting.
