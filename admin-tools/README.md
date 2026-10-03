# Chibwenzi administration activation

The published administration page is `/admin.html`. It uses a separate, memory-only Firebase Auth instance. Administrators sign in with their own Google account; granting a role does not require creating a dating profile. The dashboard is locked unless a verified Firebase account has an enabled server-owned `chibwenziAdmins/{email}` document. An email allowlist in browser JavaScript is not an authorization mechanism.

## Required activation by the Firebase project owner

1. Back up the **deployed** Firestore rules and identify every collection used by other apps in this shared Firebase project.
2. Merge the Chibwenzi rules from `firestore.rules` into the deployed rules. Preserve unrelated app rules. Review any broad wildcard permissions: Firestore combines matching grants with OR, so a permissive wildcard can bypass these protections.
3. Test the combined rules in the Firebase emulator. Publish the merged rules from Firebase Console → Firestore Database → Rules. Publishing this GitHub site does **not** publish Firebase rules.
4. Create `chibwenziAdmins/{verified-email}` from Firebase Console with boolean `enabled: true` (client writes to this collection are forbidden). Grant only approved owner/manager accounts. Alternatively, in a trusted local environment or Google Cloud Shell, install `firebase-admin`, authenticate with Application Default Credentials for the project, and run `node admin-tools/set-role.cjs PROJECT_ID MANAGER_EMAIL grant`. The manager first signs in once at `/admin.html` so their verified Firebase Auth account exists. Use `revoke` to remove this role. Never put service-account keys in the repository or browser.
5. Sign out/in on the admin page. Verify a regular account cannot load moderation data, change account status, approve verification, read reported conversations, or modify action logs. Verify an administrator can perform these actions and each write appears in the action log.
6. Test suspension using a dedicated test account: blocked users must not send messages, create matches, edit profiles, or submit likes. Recipient checks prevent messaging a blocked account. Restore access and test again.

## Implemented controls

- Counts of registered **profiles**, matches and open reports. Firebase Authentication accounts without a profile are not included.
- Profiles with all stored profile fields (private contacts excluded), completion indicator, search/status filters, pages of 50. Search covers loaded records; Load more expands coverage.
- Account suspend, ban, restore; verification approve/reject; report resolve/dismiss. A reason is mandatory and the change plus immutable audit entry commit in one Firestore batch.
- Conversation review only for a report with a validated match ID; administrator review is logged before messages are read. Maximum 200 messages per case in this release. Legacy profile reports without a match ID cannot expose private conversations.
- Chibwenzi roles use a protected, namespaced Firestore collection; generic admin custom claims do not grant access. No manager assignment from the website in this release: grants/revocations use the trusted Admin SDK script.

## Remaining limitations

The administration page is published independently from Firebase rule activation. Until rules and role are active, it must show access denied, not dummy data. Existing reports may lack conversation metadata. Firebase Auth account deletion, disabling Auth credentials, mass export, billing, email campaigns and automatic detection of all harassment/illegal content are not implemented here. Suspension applies to Firestore access; it does not delete the user's Firebase Auth account. Disable the role document to revoke Firestore administration access. Counts and searches are explicitly labelled by their data scope.

## Repeatable local checks

Run `npm install --prefix tests`, then `npm --prefix tests run test:admin` (Node 22 and Java 17+). This starts an isolated demo-project Firestore emulator, loads the proposed rules, and tests non-admin denial, reported-conversation scoping, immutable audit records, atomic moderation, suspension, verification and restoration. It does not connect to the live Firebase project. Run `node tests/registration.cjs` for the existing registration checks.
