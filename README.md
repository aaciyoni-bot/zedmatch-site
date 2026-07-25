# Chibwenzi 🇿🇲💘

Zambia's own **Tinder-style dating app** — swipe → match → chat — with
**Mobile Money** monetization. An ORIZIS TECHNOLOGY product.

Pilot: **one city, man↔woman matching only** (see *Safety & legal* below).

## What's here
- `index.html` — the whole app (single-file PWA). Runs in DEMO mode out of the box.
- `manifest.json`, `sw.js` — installable PWA (`zedmatch-v1` cache).
- `backend/` — pawaPay Mobile Money proxy for Vercel.
- `firestore.rules` — locked-down security rules (profiles, matches, messages,
  reports, verifications).
- `SETUP.md` — Firebase + pawaPay + deploy steps and the pre-launch checklist.

## Features
- 18+ age gate, profile onboarding, selfie verification.
- Swipe deck (drag / buttons), Super Like, Boost, match popup.
- Real-time-style chat between matched users only.
- "Who likes you", freemium daily like limit, premium subscription.
- Report + block + **admin moderation queue**.
- Safety center, plain-language Terms & Privacy.

## Safety & legal (read before launch)
- **18+ only**, selfie verification, report/block, active moderation.
- **City-level location only** — never exact GPS or phone numbers.
- **Man↔woman matching only** in the Zambia pilot, to comply with local law and
  keep users safe. **Get a legal review before going live** (see `SETUP.md`).

## Config
Edit `CONFIG` and `FIREBASE_CONFIG` at the top of `index.html`. Blank Firebase +
blank `API_BASE_URL` = full DEMO mode.
