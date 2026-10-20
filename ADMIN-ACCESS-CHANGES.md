# Proposed manager access expansion

Status: Elton (eltonmusakanya@gmail.com) confirmed by owner. enabled:true and fullAccess:true saved. Exact-email-scoped rule published and admin v9 verified live on 2026-10-20, commit 902acf22d81fdd5fc8248b0b50c6c5c6cb518cb0. Promoter programme remains NOT activated.

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

## Promoter accounts and 2 ZMW commissions (2026-10-20)

Accounts are defined by Yoni or Elton directly in the numbered promoter card in administration: display name, unique username (3–32 ASCII letters/digits/dot/underscore/hyphen), new password (12–128 characters), and active status. Blank password keeps the existing password. A new account requires a password. No bulk predefined usernames or passwords are created. Backend account provisioning and Auth user updates require expanded Firebase Auth write permission, beyond the previously planned read-only Auth backend access.

Personal portal: promoters.html?agent=N; recruitment link: /?agent=N. A portal URL does not authenticate its visitor. Backend authorization derives the agent number from the signed-in UID; mismatched portal links are rejected in the UI. Passwords are passed to Firebase Auth, never stored in Firestore, returned by the API or written to logs. Changing a username, password or status revokes old refresh tokens. Renaming preserves the numbered slot's existing earnings; a new person should get an unused slot. Partial account-update failures leave the account disabled for a safe retry. Creating or changing credentials must be tested against Auth before activation.

Portal: promoters.html. Username/password login, memory-only session, change password, personal link and aggregate totals. No member names, phones, photos or conversation data are returned to promoters. This tracks earned commission, not automatic disbursements. 200 integer ngwee = 2 ZMW per eligible new account. No commission daily cap was requested. Member like credits remain separate.

Eligibility: verified email, completed adult profile, private Zambian phone, and approved profile verification (verified=true and verifyStatus=approved). This interpretation of “verified” was stated to the owner; it is stricter than email alone. Phone ownership is not SMS-verified. First signed promoter visit is retained for seven days; registration attribution is stored pending. Approval calls settlement; admin reconciliation provides recovery. Financial ledger is transactionally created once per UID; identity reservations prevent duplicate normalized email/phone. No historical registration backfill.

Remaining release gates: Firebase server credential, real Firestore rules tests, portal browser/end-to-end tests, credential provisioning and secure distribution, activation. Do not claim any account or commission is live. Backend currently returns disabled. Reconciliation currently processes a bounded batch of 100 pending claims; implement cursor pagination before large-scale rollout.
