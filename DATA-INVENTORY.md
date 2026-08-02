# Chibwenzi — Record of Processing (data inventory)

**Controller:** ORIZIS TECHNOLOGIES LIMITED · reg. 120241001416 · TPIN 2002580846
41 Kasho Road, Roma Park, Lusaka, Zambia · office@orizisgroup.com
**Version:** 1.0 (draft) · 2 August 2026

> **DRAFT FOR LEGAL REVIEW.** Prepared so counsel can answer questions 4, 5 and 6 of
> `LEGAL-REVIEW.md`, and so the Google Play "Data safety" declaration can be completed
> accurately. Lawful-basis labels are our lay assessment and must be confirmed.

---

## 1. What we hold

| # | Data | Where | Who can see it | Why | Lawful basis (assumed) | Deleted |
|---|---|---|---|---|---|---|
| 1 | First name, age, gender, city | Firestore `profiles` | All signed-in members | Show your profile, match you | Contract | On account deletion |
| 2 | Bio, interests | Firestore `profiles` | All signed-in members | Profile content | Contract | On account deletion |
| 3 | Profile photos (up to 6) | Firestore `profiles` (compressed JPEG) | All signed-in members | Profile content | Contract | On account deletion |
| 4 | **Verification selfie** | Firestore `verifications` | **Moderation team only** | Confirm a real person; anti-fraud | Consent (optional feature) | On account deletion |
| 5 | Account identifier (anonymous UID) | Firebase Auth | System | Identify the account | Contract | On account deletion |
| 6 | Email address | Firebase Auth | System; shown to admin | Only if user chooses Google sign-in, so the account survives a device change | Consent | On account deletion |
| 7 | Likes / passes | Firestore `swipes` | Only the two users involved | Detect a mutual match | Contract | On account deletion |
| 8 | Matches | Firestore `matches` | Only the two matched users | Enable chat | Contract | On account deletion |
| 9 | Messages | Firestore `messages` | Only the two matched users | The chat itself | Contract | Sender's messages on deletion |
| 10 | Reports (filed / received) | Firestore `reports` | **Moderation team only** | Safety, abuse handling | Legitimate interest / legal obligation | Retained up to 24 months |
| 11 | Blocked-account marker | Firestore | System | Stop a removed user re-registering | Legitimate interest | Up to 24 months |
| 12 | Mobile Money phone number, amount, reference | pawaPay (processor); reference only on our side | Finance | Take payment; refunds; tax records | Contract / legal obligation | Per Zambian tax law |

### What we deliberately do NOT collect
- **No GPS or precise location.** Only the city the user picks from a list.
- **No Mobile Money PIN** — ever. It is entered on the user's own handset, to their operator.
- **No contact details exposed to other members** — phone number and email are never shown.
- **No advertising identifiers, no ad SDKs, no third-party analytics** at present.

---

## 2. Visibility matrix

| Data | Other members | Matched user | Moderation/admin | Third parties |
|---|---|---|---|---|
| Name, age, city, bio, interests, photos | ✅ | ✅ | ✅ | ❌ |
| Messages | ❌ | ✅ | Only if reported | ❌ |
| Verification selfie | ❌ | ❌ | ✅ | ❌ |
| Email address | ❌ | ❌ | ✅ | ❌ |
| Phone / Mobile Money number | ❌ | ❌ | ❌ | pawaPay + mobile network only |
| Likes you have given | ❌ | ❌ | ❌ | ❌ |

**Admin access is deliberately limited.** The moderation screen shows reports,
verification requests and the user roster. It does **not** provide a way to read
private conversations; reported content is reviewed on a case-by-case basis.

---

## 3. Processors and sub-processors

| Processor | Role | Data | Location |
|---|---|---|---|
| **Google (Firebase / Google Cloud)** | Hosting, authentication, database | All items 1–11 | ⚠️ **europe-west1 (Belgium)** — outside Zambia |
| **pawaPay** | Payment processing | Payer phone number, amount | Per their terms |
| **MTN / Airtel / Zamtel** | Mobile Money rails | Payer number, amount | Zambia |
| **GitHub Pages** | Static hosting of the web app | None (no personal data stored) | Global CDN |
| **Vercel** | Hosts the payment API | Transient payment request data | Global |

We do **not** sell personal data and we do not share it for advertising.

⚠️ **Cross-border transfer is the main open question** — see `LEGAL-REVIEW.md` Q5.

---

## 4. Security

- Access is controlled by **server-side Firestore security rules**, not by client code:
  profiles are readable only by signed-in users; a user may write only their own
  profile and swipes; messages are readable only by the two participants and only
  where a match document exists; reports and verifications are **write-only** for
  users and readable only by an admin.
- Transport encryption (HTTPS/TLS) everywhere; encryption at rest by Google Cloud.
- Admin identified by Google sign-in against an allow-list.
- Photos are resized and re-encoded on the device before upload, which strips EXIF
  metadata (including any camera GPS tag).

**Known gaps to close before scale:**
1. Admin authorisation is enforced in the UI and rules by email/UID allow-list; it
   should move to a Firebase **custom claim** so it is enforced entirely server-side.
2. No automated image scanning for nudity or CSAM — moderation is human and reactive.
3. No rate limiting on report submission.

---

## 5. Retention summary

| Data | Retention |
|---|---|
| Profile, photos, selfie, likes, matches, sent messages | Until the user deletes the account — immediate |
| Reports and blocked-account markers | Up to 24 months after removal ⚠️ *to be confirmed* |
| Payment records | As required by Zambian tax law ⚠️ *period to be confirmed* |
| Incident register | At least 24 months ⚠️ *to be confirmed* |

---

## 6. Data-subject rights — how each is served

| Right | How |
|---|---|
| Access | Email office@orizisgroup.com; the profile is also fully visible in-app |
| Correction | Directly in-app: Profile → Edit profile |
| Deletion | In-app: Profile → Delete my account (immediate) — or by email within 30 days |
| Objection / withdraw consent | Remove the selfie or unlink Google, or delete the account |
| Portability | On request by email ⚠️ *no automated export yet* |

---

## 7. For the Google Play "Data safety" form

Based on the table above, the app **collects**: name, email address (optional), photos,
other user-generated content (bio, messages), and app interactions. It collects
**approximate location (city)** as self-declared text, not device location. It does
**not** currently **share** any data with third parties for their own purposes.
Data is **encrypted in transit**, users **can request deletion**, and the deletion URL
is `https://chibwenzi.com/privacy.html#delete`.

⚠️ Re-check this section if analytics, advertising or automated fulfilment are ever added.
