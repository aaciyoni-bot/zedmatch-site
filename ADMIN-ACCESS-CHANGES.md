# Proposed manager access expansion

Status: code prepared, NOT activated. The existing manager's exact email and live role have not been verified. No role has been granted. Do not infer identity from a screenshot or a similar name.

| Capability | Existing enabled manager (code) | Full-access manager (proposed) |
|---|---|---|
| Redacted user directory, activity, moderation | Available | Available |
| Suspend, ban, restore, delete profile with reason | Available | Available |
| Full profile and photos | Restricted | Available |
| Private email / phone | Restricted | Available |
| Full reports and reported profile | Restricted | Available |
| Verification photo review, approve/reject | Not exposed in UI | Available |
| Delete verification request with reason | Restricted | Available |
| All conversations | Restricted | Available; reason and audit required |
| All action logs | Own actions only | All actions |
| Match and verification totals | Restricted | Available |
| Promoter links 1–100, names, notes, totals | Absent | Available to enabled managers |
| Grant roles or Firebase/Vercel infrastructure access | Unavailable | Still unavailable |

`fullAccess: true` must be added to the verified manager's existing server-owned `chibwenziAdmins/{email}` record. Client changes cannot grant this role. Every existing `cbOwner()` operational restriction now recognizes this explicit role; the owner email remains supported. Deploy rules and frontend together after emulator verification. The CLI `admin-tools/set-full-access.cjs` can inspect, grant, or revoke in a trusted authenticated environment and records changes. Run `inspect` and verify the exact email before `grant`.

## Promoter attribution

Links: `https://chibwenzi.com/?agent=1` through `?agent=100`. Export: `admin-tools/promoter-links.csv`.

The browser stores the first server-signed promoter visit for 7 days. A new verified account completing an adult profile and supplying a private Zambian phone is attributed once. Existing accounts are excluded by Auth creation time. Transactions prevent repeated UID / normalized email / phone claims and update aggregate totals. Phone ownership is not SMS-verified. These totals measure eligible completed accounts, not independently verified unique humans or raw clicks. Personal bonus-credit referrals remain separate; promoter links alone do not award credits.

Account deletion removes the personal attribution and hashed identity records, retains anonymous aggregate historical counts and a closed UID marker. No historical backfill is attempted. A first visit made while the backend is disabled cannot be attributed retrospectively.

## Activation gates

- Dedicated Firebase backend credential still missing; Google Cloud currently returns Site Unavailable in the cloud browser.
- Verify exact manager identity and existing role through a narrowly scoped trusted operator inspection.
- Rules emulator tests for full access and promoter metadata; browser UI and end-to-end production-like tests still required.
- Deploy backend with feature disabled, deploy rules/frontend, validate, then enable referrals.
- Unit tests use a serialized fake transaction store, not a Firestore emulator.
