# Chibwenzi referral bonuses — activation handoff

Status: implementation prepared, production activation blocked on backend Firebase credentials and live verification. Do not advertise bonuses before activation.

## Behavior
- Random personal invite code; no email, phone or Firebase UID in the URL.
- 5 credits to inviter / 3 to newly registered member after verified email, private phone and completed adult profile.
- 25 referral credits per inviter per calendar day in Africa/Lusaka. Cap resets at midnight; this does not change the existing daily-like reset.
- Existing accounts and self-referrals excluded. New account must be created after the code, and complete within 7 days. First invite retained on the receiving device for 7 days.
- When the inviter hits the cap, both awards remain unissued. The new member can retry next day within the eligibility window.
- Email (including Gmail aliases), phone and UID deduplication. Phone is collected, not SMS verified; this limits duplicates but cannot prove unique humans.
- Credits persist. One credit purchases one normal like after the existing free allowance. Server atomically deducts and writes the like/match; repeated requests for the same target do not debit twice.
- Existing free likes, super-like quotas, premium and launch-free behavior unchanged. Bonuses are not spent during unlimited access.

## Activation
Target Vercel project `chibwenzi-backend`, team `team_3Frj9vLrc498NxWi4booX0ib`; Firebase project `rummikube-b2188`.
1. Provision a dedicated server identity with only required Firebase Auth read/token verification and Firestore access. The Firebase project is shared; inspect actual IAM scope, do not use an unrestricted owner credential. Creating this access needs action-time approval in browser automation.
2. Store its JSON securely as sensitive production `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel. Never commit or print it. Code explicitly rejects another project.
3. Inspect live shared Firestore rules: all `chibwenziWallets`, `chibwenziInviteOwners`, `chibwenziInviteCodes`, `chibwenziReferralClaims`, `chibwenziReferralIdentities`, `chibwenziReferralDays`, and `chibwenziCreditLikes` must be denied to clients. Repo rules currently deny unmatched paths; an added explicit deny does not override a broad live allow.
4. Deploy backend with `CHIBWENZI_REFERRALS_ENABLED` unset. Confirm config returns false and referral writes return 503. Existing payment routes must remain unchanged.
5. Test isolated staging with verified, consenting test users: Google/email registration, profile persistence, referral landing, claim/retry, cross-device balances, Zambia midnight cap, spending, blocked/suspended users, match creation. Test production permissions against actual rules before opening access.
6. Merge frontend and privacy notice, deploy backend production, set `CHIBWENZI_REFERRALS_ENABLED=true`, redeploy. Confirm config + a real authorized flow, then promote/announce. Existing registration incident must be verified resolved.

## Privacy and deletion work before activation
New server-only collections store invitation relationships, balances, daily totals, transaction dedupe and hashed email/phone identifiers. These hashes remain personal data. Public code is opaque; referrer receives no recipient contact details. The authenticated delete endpoint closes issuance, deletes referral records and hashed identities, and removes the wallet/invite code before the client deletes its profile. A minimal closed UID marker remains to prevent reissuance by a still-valid session. Privacy disclosure is included. Validate cleanup against live staging before activation; no production deletions have been performed.

## Validation performed
`node backend/referrals.test.js`, `node tests/reconnect.cjs`, `node tests/registration.cjs`, inline script syntax and `git diff --check`.
Service tests use an in-memory transaction double, not live Firebase or emulator. They cover rewards, repeat claims, self-referrals, old accounts, verification, duplicate phone, completion, cap rollover, durable balances, idempotent atomic spending, suspension and zero funds. Real concurrency/security/UI tests remain activation gates.
