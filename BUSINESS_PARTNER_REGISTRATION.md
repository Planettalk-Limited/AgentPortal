# Business Partner Registration — Frontend Notes

The API reference and the full partner lifecycle live in the backend repo:
**`AgentPortalBackend/docs/BUSINESS_PARTNER_REGISTRATION.md`**

This file used to be a byte-identical copy of that document and drifted out of
date. It is now a pointer plus the parts specific to this repo.

> **Changed September 2026.** Business partners no longer go through admin
> review. They follow the same flow as individual partners and receive a generic
> `PTA####` code automatically once they verify their email.

---

## Where the registration flow lives

| Concern | File |
|---|---|
| Partner type choice + registration form | `src/app/[locale]/auth/register/page.tsx` |
| Landing page Sign Up button | `src/components/Hero.tsx` |
| Email verification screen | `src/app/[locale]/auth/verify-email/page.tsx` |
| Admin business partner directory | `src/app/[locale]/admin/business-partners/page.tsx` |
| API calls | `src/lib/api/services/admin.service.ts` |
| Copy | `src/i18n/messages/{en,es,fr,pt}.json` under `auth.register` |

## Business fields collected

`companyName`, `businessAddress`, `primaryBusinessActivity`,
`primarySpecialty`, `sellsInternationalGoods`.

`customerInteractionType` was removed in September 2026 — its fixed options
(sit-down, grab-and-go, appointment-based) did not describe retailers such as
grocery stores. Existing records keep the value; the form no longer collects it.
The admin detail view still renders it when present.

The onboarding meeting booking was removed at the same time. It could not scale
to the expected volume, and applicants who clicked through to the booking page
had no clear way back to the form.

## Country restriction

Business partner registration is limited to the countries in
`src/lib/constants/presenceCountries.ts` (`BUSINESS_PARTNER_PRESENCE_COUNTRIES`).
Individual partners are not restricted.

## Localisation

Four locales — `en`, `es`, `fr`, `pt`. Every key added or removed in `en.json`
must be mirrored in the other three, or the missing locale renders the raw key
in production.

## Email banners

Email banners are served from this repo at `public/images/`:

| File | Size | Used by |
|---|---|---|
| `partner-email-header.jpg` | 600×200 | Header of every partner email |
| `partner-welcome-hero.jpg` | 1600×800 | Welcome emails |

The backend references them at `https://portal.planettalk.com/images/...`, so
**deleting or renaming either file breaks the images in live email**. They are
not imported by any component, so nothing in this repo will fail to build if
they are removed.

## Admin business partners page

Read-only directory. There is nothing to approve. The one write it supports is
assigning a custom partner code, which calls
`PATCH /admin/agents/:id/agent-code`.

⚠️ Changing a code breaks the partner's existing referral links immediately —
the agent code *is* the referral identifier.
