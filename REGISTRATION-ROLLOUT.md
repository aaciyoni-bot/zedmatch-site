# Registration rollout — pending Firebase access

This branch is not ready for production until the Firebase configuration is verified.

## Implemented
- Google or email/password authentication before profile onboarding.
- Anonymous accounts can link credentials; returning email users sign in separately.
- Required Zambian mobile number, normalized to +260 format, saved only in `chibwenziContacts/{uid}`. No phone in public profiles or local storage.
- Owner-only contact rules, no collection listing, server timestamp validation, non-anonymous writes.
- Password reset and privacy-policy update; contact deletion included in account deletion.
- Returning accounts without a contact number must complete that step.
- A supplied phone number is not SMS verified. Email verification is not enforced in this change.

## Deployment prerequisites
1. Open project `rummikube-b2188` with an authorized Firebase session; current browser session is signed out.
2. Read/export actual live Firestore rules first. This project may host other apps. Merge only the `chibwenziContacts` match block; do NOT overwrite unrelated rules with this repo's rules.
3. Confirm there is no broader rule granting public access to this collection. Test owner get/create/update/delete allowed, other-user reads/writes and listing denied, anonymous writes denied, malformed phones and extra fields denied.
4. Verify Google and email/password providers are enabled and chibwenzi.com is an authorized domain. Configure password-reset email delivery.
5. Deploy merged private-contact rules before publishing frontend.
6. Verify on mobile and desktop: new Google/email registration, returning login, reset email, profile reload, private phone inaccessible to another user, contact deletion, failed-network retries. Use dedicated authorized test accounts.
7. Publish frontend and cache revision only after these checks pass.

Local check: `node tests/registration.cjs` (mocked Firebase; not a substitute for deployed-rule and browser verification).

Daily credits remain a separate pending server-enforced change. This branch does not implement daily credits or make the existing free beta production-ready.
