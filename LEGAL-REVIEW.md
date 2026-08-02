# Chibwenzi — Legal Compliance Briefing (for review by Zambian counsel)

**Prepared:** 2 August 2026
**Product:** Chibwenzi — an 18+ online dating application for the Zambian market
**Operator:** ORIZIS TECHNOLOGIES LIMITED · reg. no. 120241001416 · TPIN 2002580846
41 Kasho Road, Roma Park, Lusaka, Zambia · office@orizisgroup.com
**Live at:** https://chibwenzi.com (also to be distributed via Google Play)

> **STATUS: DRAFT FOR LEGAL REVIEW — NOT LEGAL ADVICE.**
> This document was prepared by the development team to describe what the product
> actually does and to map it against the Zambian law we believe applies. It is
> written so that qualified Zambian counsel can verify it quickly. Statutory
> references must be confirmed against current law before launch. Section 7 lists
> the specific questions we need counsel to answer, and Section 8 is the sign-off.

---

## 1. What the product actually does

A mobile-first web application (PWA) where adults in Zambia create a profile, are
shown other members one at a time, and can exchange messages once both have
indicated interest ("a match").

| Function | Implementation |
|---|---|
| Registration | Anonymous account created on first use; optional Google sign-in to make it permanent |
| Age gate | Hard 18+ confirmation before any content is shown; date of birth/age captured and required to be ≥ 18 |
| Profile | First name, age, gender, **city only**, short bio, interests, up to 6 self-uploaded photos |
| Verification | Optional selfie, reviewed by a human moderator; never displayed publicly |
| Discovery | Users are shown only members of the opposite sex (see §3) |
| Messaging | Only between mutually-matched users |
| Safety | In-app report and block; reports go to a moderation queue reviewed by staff |
| Payment | Subscription K100/month via Mobile Money (MTN/Airtel/Zamtel) through pawaPay |
| Launch promo | Free for all users until 31 October 2026 |
| Data deletion | Self-service in-app deletion + email route (see §5) |

**Data deliberately NOT collected:** precise/GPS location (city only), and no phone
number or email address is ever exposed to another member.

---

## 2. Statutes we believe are engaged
*(to be verified by counsel — see §7 Q1)*

| Area | Instrument (as we understand it) | Relevance |
|---|---|---|
| Sexual offences | **Penal Code Act, Cap. 87**, ss. 155–158 | Criminalises same-sex sexual conduct. Drives the design decision in §3. |
| Child protection | Penal Code; **Children's Code Act No. 12 of 2022** | Absolute prohibition on minors; drives the 18+ gate and removal-on-sight policy |
| Data protection | **Data Protection Act No. 3 of 2021** | Lawful basis, data-subject rights, security, possible registration as data controller |
| Cyber | **Cyber Security and Cyber Crimes Act No. 2 of 2021** | Offences re: harassment, obscene material, illegal data access; possible reporting duties |
| E-commerce | **Electronic Communications and Transactions Act No. 4 of 2021** | Validity of online contracts, consumer disclosures, ZICTA oversight |
| Consumer | **Competition and Consumer Protection Act No. 24 of 2010** | Fair terms, honest pricing, refunds; CCPC as complaints forum |
| Payments | **National Payment Systems Act**; Bank of Zambia | We do not hold funds ourselves — pawaPay is the licensed provider (see §7 Q6) |
| Anti-trafficking | **Anti-Human Trafficking Act No. 11 of 2008** | Reporting/withdrawal duties if the platform is used for trafficking or prostitution |

---

## 3. The central legal decision: opposite-sex matching only

**What we built.** Discovery is restricted so that men are shown only women and women
are shown only men. This is enforced in the matching engine, not merely as a user
preference, and there is no setting that allows a user to change it.

**Why.** Zambia criminalises same-sex sexual conduct. A feature that actively
introduces two users of the same sex to each other could, in our lay understanding,
expose (a) those **users** to prosecution and to physical danger, and (b) the company
and its officers to accessory or facilitation liability. The owner, Yoni Aaci, was
presented with the alternatives and instructed that the pilot must be
opposite-sex-only, on both legal and user-safety grounds.

**Position to be confirmed by counsel.** We treat this as harm-minimisation for users
in the jurisdiction where the service is offered, not as a statement of values. We ask
counsel to confirm in §7 Q2 whether this design is (i) legally necessary, (ii) legally
sufficient, and (iii) whether any additional wording is required — or must be avoided
— in the public Terms so that the restriction does not itself create exposure.

---

## 4. Published legal documents

All are live and publicly reachable without logging in:

| Document | URL |
|---|---|
| Terms of Service | https://chibwenzi.com/terms.html |
| Privacy Policy | https://chibwenzi.com/privacy.html |
| Community Guidelines | https://chibwenzi.com/community-guidelines.html |
| Refund & Cancellation | https://chibwenzi.com/refunds.html |
| Accessibility Statement | https://chibwenzi.com/accessibility.html |
| Account deletion | https://chibwenzi.com/privacy.html#delete |

They currently state: company identity and TPIN; 18+ only; that members are not
vetted and the company is not responsible for members' offline conduct; anti-scam
warnings; that liability is capped at fees paid in the preceding 3 months **without
excluding non-excludable rights** under the CCPA 2010 and ECTA 2021; Zambian governing
law; and CCPC/ZICTA as complaint routes.

**Counsel is asked to review the actual wording of each**, in particular the liability
cap and the safety disclaimers (§7 Q3).

---

## 5. Data protection mapping (Act No. 3 of 2021)

| Requirement | What we do |
|---|---|
| Controller identity | Named with registration no., TPIN and address in the Privacy Policy |
| Categories collected | Profile data, photos, verification selfie, likes/matches, messages, reports, basic device data |
| Sensitive data | ⚠️ Photos + a dating context may imply data about sex life. **See §7 Q4** |
| Lawful basis | Consent for optional items (selfie, Google sign-in); contract performance for core service |
| Purpose limitation | Selfie used only for verification; never shown publicly |
| Minimisation | City-level location only; no GPS; phone/email never shown to other members |
| Security | Firebase (Google Cloud) with server-side security rules; TLS in transit; encryption at rest |
| Retention | Deleted on request; abuse records kept up to 24 months; payment records per tax law |
| Data-subject rights | Access, correction, deletion — in-app and by email |
| Deletion | Self-service: Profile → Delete my account. Erases profile, photos, selfie, likes, matches and sent messages **(tested and verified working)** |
| Cross-border transfer | ⚠️ Data is stored on Google Cloud **outside Zambia** (europe-west1). **See §7 Q5** |
| Breach notification | ⚠️ Procedure not yet written. **See §7 Q7** |

---

## 6. Safety controls already implemented

These exist in the product today and have been tested:

1. **18+ gate** before any content is visible; age must be ≥ 18 to create a profile.
2. **Selfie verification**, human-reviewed, to reduce fake profiles and romance fraud.
3. **Report** (fake profile / asking for money / harassment / inappropriate photos /
   under 18 / other) — filing a report also **blocks that user immediately** and
   removes any match.
4. **Block**, independent of reporting.
5. **Moderation queue** — an admin screen reading live reports and verification
   requests, with remove / dismiss / approve / reject actions.
6. **No fake profiles.** Every profile shown is a real registered user; the seeded
   demo personas that existed during development were deleted.
7. **Safety Centre** in-app: never send money; keep personal details private; meet in
   public; how to report.
8. **Privacy by design:** city-level location only; contact details never exposed.
9. **Private messages are not routinely readable by staff** — only reported content is
   reviewed.

---

## 7. Questions we need counsel to answer

**Q1 — Statutes.** Is the list in §2 correct and complete for an 18+ dating service
offered to the public in Zambia? What have we missed?

**Q2 — Opposite-sex-only design (§3).** Is this necessary and sufficient to avoid
liability for the company and its officers, and to avoid exposing users? Should the
restriction be described in the Terms, or is it safer to state only the neutral
matching rule? Is there any obligation we would be breaching by *not* offering
same-sex matching?

**Q3 — Terms & disclaimers (§4).** Are the liability cap, the "we do not vet members"
disclaimer and the offline-meeting disclaimer enforceable under the CCPA 2010 and
ECTA 2021? Any clause that is void or that must be added?

**Q4 — Sensitive personal data.** Does profile data on a dating platform constitute
"sensitive personal data" under the Data Protection Act 2021? If so, what additional
consent wording, security or registration obligations apply?

**Q5 — Cross-border transfer.** Personal data (including photos and verification
selfies) is stored on Google Cloud infrastructure outside Zambia. What is required —
consent, contractual safeguards, notification, or local storage?

**Q6 — Controller registration & payments.** Must ORIZIS TECHNOLOGIES LIMITED register
as a data controller, and with whom? Separately: does taking subscription payments
through pawaPay (a licensed provider) create any Bank of Zambia or licensing
obligation for us?

**Q7 — Incident duties.** What are our obligations, and to whom, on (a) a personal-data
breach, (b) discovering a user is under 18, (c) a credible report of trafficking,
prostitution or a sexual offence, (d) a lawful request from police or ZICTA? We need a
written procedure.

**Q8 — Marketing.** Any restriction on advertising a dating service in Zambia
(platform, content, or age-targeting)?

**Q9 — Age verification.** Is self-declared age plus optional selfie sufficient, or
does Zambian law require stronger age assurance (ID document)?

**Q10 — Anything else** that in your professional judgement should stop or change this
launch.

---

## 8. Counsel sign-off

To be completed by the reviewing legal practitioner:

- [ ] §2 statute list verified and corrected
- [ ] §3 opposite-sex-only design reviewed and confirmed
- [ ] Terms of Service reviewed / amended
- [ ] Privacy Policy reviewed / amended
- [ ] Community Guidelines reviewed
- [ ] Refund policy reviewed against CCPA 2010
- [ ] Data-protection registration position confirmed
- [ ] Cross-border transfer position confirmed
- [ ] Incident-response procedure supplied
- [ ] **Cleared to launch** ☐ Yes ☐ Yes, subject to the conditions attached ☐ No

Name: ______________________  Firm: ______________________
Practising certificate no.: ______________________
Signature: ______________________  Date: ______________

---

## 9. Note for the Google Play submission

Google reviews dating applications by hand and applies its own policies in addition to
national law. The company already has eight other applications on the same developer
account, so a policy strike here carries wider commercial risk. This review should be
completed and any required changes made **before** Chibwenzi is submitted.
