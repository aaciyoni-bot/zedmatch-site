# ZedMatch — one-time setup

ZedMatch runs out of the box in **DEMO mode** (localStorage + seeded profiles,
simulated payments) so you can test the full flow immediately. To go live with
real accounts and real money, do the steps below.

---

## 1. Firebase (real accounts, chat, moderation)

1. Go to <https://console.firebase.google.com> → **Add project** → name it `zedmatch`.
2. **Authentication** → Get started → enable **Phone** (and/or **Email/Password**).
   - Phone auth needs billing enabled (Blaze plan) but has a free monthly tier.
3. **Firestore Database** → Create database → *Production mode*.
4. **Storage** → Get started (for profile photos + verification selfies).
5. Rules → paste the contents of [`firestore.rules`](firestore.rules) and **Publish**.
6. Project settings → *Your apps* → **Web app** → copy the config values into
   `FIREBASE_CONFIG` in `index.html`, then set `FIREBASE_ON = true`.

### Make yourself an admin (moderation queue)
The moderation tab is gated on the auth token claim `admin === true`. Set it once
with the Firebase Admin SDK (Cloud Function or a local script):

```js
admin.auth().setCustomUserClaims('<your-uid>', { admin: true });
```

> ⚠️ Moderation is **ongoing work**, not "build and forget". Reports and
> verification selfies must be reviewed regularly so law-breaking or unsafe
> profiles are removed fast.

---

## 2. Payments — pawaPay Mobile Money

The backend (`backend/server.js`) proxies pawaPay. Prices live **on the server**
(`PRICES`) so a tampered client can't pay less.

1. `cd backend && npx vercel link --yes --project zedmatch-backend`
2. In Vercel → Project → Settings → Environment Variables:
   - `PAWAPAY_TOKEN` = your pawaPay API token
   - `PAWAPAY_ENV` = `production` (or leave unset for `sandbox`)
3. `npx vercel --prod --yes`
4. Test: open `https://<your-backend>.vercel.app/api/health` →
   `paymentsConfigured: true`.
5. In `index.html`, set `CONFIG.API_BASE_URL` to your backend URL.

Until `PAWAPAY_TOKEN` is set, `/api/pay` returns `{ simulated: true }` and the app
uses its local simulation — safe for demos.

---

## 3. Deploy the app (GitHub Pages)

```bash
cd zedmatch-site
git init && git add -A && git commit -m "ZedMatch"
gh repo create aaciyoni-bot/zedmatch-site --public --source=. --push
gh api -X POST repos/aaciyoni-bot/zedmatch-site/pages -f "source[branch]=main" -f "source[path]=/"
```

Live at `https://aaciyoni-bot.github.io/zedmatch-site/`.

---

## 4. Before you launch — checklist (do NOT skip)

- [ ] **Legal review.** Zambia is a conservative jurisdiction; some relationships
      are criminalised in local law. The pilot is **man↔woman only** by design.
      Have a lawyer review Terms, Privacy Policy and local compliance first.
- [ ] **Real Terms of Service & Privacy Policy** (the in-app screen is a summary).
- [ ] **Set the real support number** in `CONFIG.WHATSAPP_SUPPORT` (business line).
- [ ] **18+ gate** verified working.
- [ ] **Verification + moderation** staffed — someone reviews the queue daily.
- [ ] **Cold-start plan.** Launch one city (e.g. Lusaka) or one campus/community
      first, with referral incentives, so there are enough people to match with.
