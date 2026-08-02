# Chibwenzi — Incident Response Procedure

**Operator:** ORIZIS TECHNOLOGIES LIMITED · reg. 120241001416 · TPIN 2002580846
**Owner of this procedure:** Yoni Aaci · office@orizisgroup.com
**Version:** 1.0 (draft) · 2 August 2026

> **DRAFT FOR LEGAL REVIEW.** This is the internal procedure we intend to follow.
> Statutory deadlines and the correct authority for each notification must be
> confirmed by Zambian counsel (question 7 of `LEGAL-REVIEW.md`) before launch.
> Where a timescale is marked ⚠️ we have assumed a reasonable period, not a verified
> statutory one.

---

## 0. Principles

1. **Protect the person first.** Safety of a user comes before the product, the brand
   and the paperwork.
2. **Act, then document.** Remove the danger, then write down what happened and when.
3. **Never destroy evidence.** Suspend and preserve; do not "clean up" an account that
   is under investigation.
4. **One decision-maker.** Yoni Aaci decides on escalation to authorities. If he is
   unreachable and a person is in immediate danger, act first and tell him after.
5. **Say true things.** Never tell a user, a regulator or a platform something we have
   not verified.

---

## 1. Severity levels

| Level | Meaning | Response time |
|---|---|---|
| **P1 — Critical** | Immediate risk to life or safety; a minor on the platform; trafficking or sexual offence; large personal-data breach | Immediately, any hour |
| **P2 — High** | Fraud/extortion in progress; credible harassment or threats; small data exposure; account takeover | Same day |
| **P3 — Standard** | Fake profile, spam, nudity, ordinary abuse report | Within 48 hours |
| **P4 — Low** | Cosmetic, duplicate or unclear report | Within 7 days |

---

## 2. Incident A — a user is, or may be, under 18

**Trigger:** a report, a moderator's suspicion, a selfie that looks underage, or the
user says so.

1. **Suspend the account immediately** — before investigating. Hide the profile from
   discovery so no further contact is possible.
2. Preserve the profile, photos, selfie and message metadata. **Do not delete.**
3. Review the verification selfie and the stated age. If doubt remains, keep the
   account suspended — the benefit of the doubt goes to protecting the child.
4. If confirmed or still doubtful: **permanently remove the account** and block
   re-registration.
5. If there is any indication of sexual contact, grooming, or sexual imagery involving
   the minor: **preserve everything and escalate to the Zambia Police immediately**
   (see §7). Do not contact the suspected adult.
6. Log the incident in the register (§8).

> ⚠️ Counsel to confirm: our reporting duty and to which body, and how long we must
> retain preserved material.

---

## 3. Incident B — personal data breach

**Trigger:** unauthorised access to profiles, photos, selfies or messages; a leaked
credential or key; a security rule that exposed data; a lost admin device.

**Within the first hour**
1. Contain: revoke the affected credential/key, tighten or roll back Firestore rules,
   force sign-out if needed.
2. Preserve logs. Note the time you became aware — the clock runs from then.

**Within 24 hours**
3. Establish scope: which users, which categories of data, how many records, whether
   it was accessed or merely exposed, and whether it is now contained.
4. Record it in the register (§8) even if it turns out to be minor.

**Then**
5. **Notify the regulator** if the breach is notifiable. ⚠️ *Counsel to confirm the
   authority (Data Protection Commissioner / ZICTA), the deadline, and the threshold.*
   Our working assumption is notification without undue delay, and no later than
   **72 hours** from awareness.
6. **Notify affected users** in plain English where there is a real risk to them —
   what happened, what data, what we have done, what they should do.
7. Post-incident review within 7 days: root cause, fix, and what prevents a repeat.

**Special case — verification selfies.** These are the most sensitive item we hold.
Any exposure of selfies is treated as **P1** regardless of volume.

---

## 4. Incident C — trafficking, prostitution or a sexual offence

**Trigger:** a report or moderator observation suggesting commercial sexual services,
coercion, or a sexual offence arranged through the platform.

1. Suspend the reported account immediately; preserve all content.
2. Do **not** interrogate the reporting user; do not promise them an outcome.
3. Escalate to the decision-maker (§0.4) the same day.
4. Where there is a credible indication of trafficking or coercion, **report to the
   Zambia Police**. ⚠️ *Counsel to confirm the duty and the correct unit under the
   Anti-Human Trafficking Act.*
5. Offer the affected user the safety information in §9 and the option to delete their
   account.

---

## 5. Incident D — fraud, romance scam or extortion

1. Suspend the reported account; preserve the chat.
2. Warn the victim not to send any further money and to keep their own evidence.
3. Tell them plainly that **we cannot recover money already sent** and advise them to
   report it to their mobile money operator and to the Zambia Police.
4. Ban the account and block re-registration.
5. If the same pattern appears across several accounts, review whether a product
   change is needed (e.g. stricter verification before messaging).

---

## 6. Incident E — request from police, a court or a regulator

1. **Do not hand over anything on the spot.** Take the request in writing.
2. Verify it is genuine: the requesting body, the officer, the legal basis, the
   specific data sought.
3. Send it to the decision-maker and to counsel before responding.
4. Disclose only what the request actually covers — never a whole database.
5. Record what was disclosed, to whom, under what authority, and when (§8).
6. Tell the affected user, unless we are lawfully prohibited from doing so.

> ⚠️ Counsel to confirm what may be disclosed without a court order, and whether
> user notification is permitted.

---

## 7. Emergency contacts

| Who | Contact |
|---|---|
| Zambia Police emergency | **991** (or 999) |
| Company decision-maker | Yoni Aaci — office@orizisgroup.com |
| Legal counsel | *to be completed on engagement* |
| Data protection authority | *to be confirmed by counsel* |
| ZICTA | *to be completed* |
| CCPC | *to be completed* |
| Payment provider (pawaPay) | via merchant dashboard support |

---

## 8. Incident register

Every P1 and P2 incident, and every data breach of any size, is recorded — even if no
notification was required. Minimum fields:

| Field |
|---|
| Incident ID and date/time we became aware |
| Severity (P1–P4) and type (A–E) |
| How we found out (user report / moderator / system) |
| Accounts involved (IDs, not names, where possible) |
| What data or people were affected, and how many |
| Immediate containment action and the time it was taken |
| Decision on notification — to whom, when, or the reason none was required |
| Outcome and permanent fix |
| Who handled it |

Kept for **at least 24 months**. ⚠️ *Counsel to confirm the required retention.*

---

## 9. Standard message to a user who reports feeling unsafe

> Thank you for telling us — you did the right thing.
>
> We have blocked that account from contacting you and our team is reviewing it.
>
> If you are in immediate danger, please call the Zambia Police on **991**.
>
> Please do not send money to anyone you meet on Chibwenzi, and do not share your home
> or work address or your Mobile Money PIN. If you have already sent money, contact
> your mobile money operator and the police as soon as you can.
>
> If there is anything else you can tell us, reply to this message. If you would rather
> leave the platform, you can delete your account and everything on it from
> Profile → Delete my account.

---

## 10. Review

This procedure is reviewed after every P1 incident, and otherwise every 6 months.
Next scheduled review: **2 February 2027**.
