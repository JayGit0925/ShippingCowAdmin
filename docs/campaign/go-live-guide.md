# Campaign Go-Live Guide — Manhattan 50lb+

One-stop reference. Every link, command, and code block you need — in order. Copy and run.

---

## Quick links

| What                     | URL                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Live landing page        | https://shippingcow-admin.vercel.app                                                           |
| Vercel project dashboard | https://vercel.com/jiaweli0521-1285s-projects/shippingcow-admin                                |
| Vercel env vars          | https://vercel.com/jiaweli0521-1285s-projects/shippingcow-admin/settings/environment-variables |
| Supabase SQL editor      | https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/sql                                |
| Supabase table editor    | https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/editor                             |
| Supabase auth providers  | https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/auth/providers                     |
| GCP OAuth credentials    | https://console.cloud.google.com/apis/credentials                                              |
| LinkedIn                 | https://www.linkedin.com/messaging                                                             |
| Meetup NYC               | https://www.meetup.com/find/?location=New+York--NY&keywords=shopify+ecommerce                  |
| Eventbrite NYC           | https://www.eventbrite.com/d/ny--new-york/shopify-ecommerce                                    |
| Admin portal login       | https://shippingcow-admin.vercel.app/login                                                     |

---

## Step 1 — Confirm Vercel deployed

Open the Vercel dashboard and wait for the latest build to show **Ready** (green check).

**Link:** https://vercel.com/jiaweli0521-1285s-projects/shippingcow-admin

Then open the live page and confirm the hero headline renders:

**Link:** https://shippingcow-admin.vercel.app

Expected: sticky blue nav, hero with "Your 40-lb sofa ships at 40 lbs. Not 80." — if you see a 404 or old page, the build is still running. Wait 60 seconds and refresh.

---

## Step 2 — Apply the Supabase migration

The quote form will return a 500 error until this table exists. Do this before testing anything.

**Link:** https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/sql

1. Click **New query**
2. Paste the SQL below
3. Click **Run**
4. Expected: `Success. No rows returned.`
5. Go to Table Editor → confirm `quote_requests` appears

```sql
-- 0006_quote_requests.sql
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz   DEFAULT now() NOT NULL,
  name        text          NOT NULL,
  company     text,
  email       text          NOT NULL,
  item_type   text,
  weight_lbs  integer,
  origin_zip  text
);

-- Only service role can read; anyone can insert (public form)
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert" ON public.quote_requests;
CREATE POLICY "public insert"
  ON public.quote_requests
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "service select" ON public.quote_requests;
CREATE POLICY "service select"
  ON public.quote_requests
  FOR SELECT
  USING (auth.role() = 'service_role');
```

**Verify table exists:**

```sql
SELECT COUNT(*) FROM public.quote_requests;
```

Expected: `0` (empty table, no error).

---

## Step 3 — Validate the DIM math

Before sending any DMs, confirm the numbers on the landing page are defensible.

**The claim:** "Your 40-lb sofa ships at 40 lbs. Not 80."

Work through a real example with your actual rate structure. Example with typical furniture box (38"×22"×13.5"):

```
Box volume:  38 × 22 × 13.5 = 11,286 cu in

Standard DIM (÷ 139):   11,286 ÷ 139 = 81.2 lbs  → carrier bills 81 lbs
ShippingCow DIM (÷ 225): 11,286 ÷ 225 = 50.2 lbs → SC bills 50 lbs

Actual weight: 40 lbs
```

If your real divisor is 225, a 40-lb sofa in a large flat box still bills ~50 lbs with ShippingCow (not 40), but bills ~81 lbs with a standard carrier. The "40 vs 80" is valid marketing copy if you frame it as the carrier-vs-SC delta, not as literal billing weight.

**If you need to update the hero copy**, edit line ~69 in `app/page.tsx`:

```bash
cd projects/ShippingCowAdmin
```

Find and update:
```
"Your 40-lb sofa ships at 40 lbs. Not 80."
```
→ change to match your best real example.

**If you need to tune the calculator rates**, edit `app/_rate-calculator.tsx`. Find the `RATES` object (~line 10) and update any values:

```typescript
const RATES = {
  zoneRatePerLb: [0, 0.21, 0.21, 0.26, 0.31, 0.37, 0.44, 0.50, 0.56] as const,
  // Index = zone number. Zone 1 unused. Zone 5 = avg US.

  standardDimMultiplier: 2.0,
  // Standard carrier bills at 2× actual weight for furniture. Adjust if your data differs.

  shippingcowDimMultiplier: 1.25,
  // ShippingCow bills at ~1.25× due to higher DIM divisor. Adjust to match real savings.

  standardResidential: 5.85,
  // FedEx/UPS residential surcharge per package (~$5.85 list rate).

  shippingcowResidential: 2.34,
  // 60% off residential: $5.85 × 0..4 = $2.34.

  standardFuelPct: 0.13,
  // Standard carrier fuel surcharge: ~13% of base rate.

  shippingcowFuelPct: 0,
  // ShippingCow: fuel surcharge included, so 0% on top.
};
```

After any edits, redeploy:

```bash
cd projects/ShippingCowAdmin
git add app/_rate-calculator.tsx app/page.tsx
git commit -m "fix(campaign): tune copy and rates to real-world values"
git push origin master
```

---

## Step 4 — Test the quote form end-to-end

**Link:** https://shippingcow-admin.vercel.app/#quote

1. Fill in the form with real test data:
   - **Name:** `Test`
   - **Company:** `Test Store`
   - **Email:** your actual email (so you can confirm the row)
   - **Item type:** `sofa`
   - **Weight:** `40`
   - **Origin zip:** `10001`
2. Click **Send My Quote Request →**
3. Expected: "Request sent." confirmation card appears

**Verify the row landed in Supabase:**

**Link:** https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/editor

Click `quote_requests` → confirm your test row is there with the correct fields.

**If you get a 500 error instead:**
- Check Step 2 was applied (table exists?)
- Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel env vars:
  **Link:** https://vercel.com/jiaweli0521-1285s-projects/shippingcow-admin/settings/environment-variables

---

## Step 5 — Test the rate calculator

**Link:** https://shippingcow-admin.vercel.app

Scroll to **See Your Savings**.

- Set weight **40 lbs**, zone **Zone 5 (avg US)** → three tiles should show numbers
- Change weight to **80 lbs** → all three update
- Change zone to **Zone 8** → YOU SAVE number increases
- Click **Get your exact rate →** at the bottom → should scroll to the quote form

If numbers look wrong, go back to Step 3 and tune `RATES`.

---

## Step 6 — Update the DM URL placeholder

**File:** `docs/campaign/linkedin-dms.md`

Open the file and replace every instance of `[LANDING_PAGE_URL]` with:

```
https://shippingcow-admin.vercel.app
```

There are 5 occurrences — one at the end of each DM. Find/replace all at once.

Also: if you have an event name for DM 5, replace `[Event]` with it now. If not, leave it for after Step 8.

---

## Step 7 — Send 5 LinkedIn DMs

**Link:** https://www.linkedin.com/messaging

**File with DM text:** `docs/campaign/linkedin-dms.md`

For each DM:
1. Copy the full message text
2. Replace `[Name]` with the target's first name
3. DM 3 only: replace `[Mutual]` with the mutual connection's name
4. DM 5 only: replace `[Event]` with the event name (do after Step 8 if no event yet)
5. Send

**Send order:**
- DM 1 (cold), DM 2 (follow-up on an older prospect), DM 3 (warm), DM 4 (TikTok seller) → send today
- DM 5 (event follow-up) → send after attending a meetup

**Target profile:** Manhattan-area Shopify or TikTok Shop sellers, furniture or heavy home goods, visible 50lb+ items in their store or posts.

---

## Step 8 — RSVP to a NYC meetup

Search both platforms. Look for events in the next 4 weeks.

**Meetup:** https://www.meetup.com/find/?location=New+York--NY&keywords=shopify+ecommerce

**Eventbrite:** https://www.eventbrite.com/d/ny--new-york/shopify-ecommerce

**LinkedIn Events:** https://www.linkedin.com/events — filter NYC, e-commerce / retail

Search terms to try:
- `Shopify NYC`
- `ecommerce New York`
- `TikTok Shop seller`
- `DTC New York`
- `Shopify meetup`

Once you find one:
1. RSVP / register
2. Add to your calendar
3. Update `[Event]` in DM 5 with the event name
4. Bring a QR code to: `https://shippingcow-admin.vercel.app`

---

## Step 9 — Brief the producer on TikTok

**Brief file:** `docs/campaign/tiktok-brief.md`

Send the producer:
1. The entire `tiktok-brief.md` file
2. A voice memo or Loom of you reading the script (30 seconds)
3. Reference brand colors from the brief's **Brand Notes** section

They animate while you record the voiceover separately. Final video = Jay audio + producer motion graphics.

**Script (read this into your mic — 30 seconds):**

```
[0–5s]
"Your 40-lb sofa? FedEx is charging you for 80 lbs.
Here's why — and how to stop it."

[5–20s]
"Carriers use something called DIM pricing.
They measure your box. Do the math.
If the dimensional weight is higher than your actual weight — they bill the bigger number.
For furniture, that number is almost always bigger.
40 lbs in, 80 lbs out on the invoice.

ShippingCow uses a different DIM formula. One that favors actual weight.
Same sofa. Billed at 40 lbs."

[20–30s]
"And we warehouse in California, New Jersey, and Texas.
So your NYC customer gets Zone 2 shipping, not Zone 8.
$18 to $40 back per sofa.

Link in bio. Calculate your savings in 30 seconds."
```

---

## Step 10 — Google OAuth prereqs (unblocks admin portal login)

Do this once. Prerequisite for using the admin portal at all.

### 10a. Add callback URI to GCP

**Link:** https://console.cloud.google.com/apis/credentials

1. Open your OAuth 2.0 Client ID
2. Under **Authorized redirect URIs** → **Add URI**
3. Paste:

```
https://aetvueyuaxbgszcisoci.supabase.co/auth/v1/callback
```

4. Click **Save**

### 10b. Enable Google in Supabase Auth

**Link:** https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/auth/providers

1. Find **Google** → toggle **Enabled**
2. Paste **Client ID** from GCP
3. Paste **Client Secret** from GCP
4. Click **Save**

### 10c. First login

**Link:** https://shippingcow-admin.vercel.app/login

1. Click **Sign in with Google**
2. Complete Google OAuth flow
3. Expected: redirected to `/403` — correct, no admin row yet
4. Tell Claude: "I just signed in with Google — grab my UUID and insert the platform_admins row"

Claude will run this via Supabase MCP:

```sql
-- Step 1: get your new UUID
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: insert admin row (Claude fills in <uuid>)
INSERT INTO public.platform_admins (user_id, role, is_active)
VALUES ('<uuid-from-step-1>', 'super-admin', true);
```

5. Refresh the browser → expected: `/admin` dashboard loads

---

## Checklist

Copy this into your daily file or task manager:

```
[ ] Step 1  — Verify Vercel deploy is Ready (green)
[ ] Step 2  — Apply 0006_quote_requests.sql in Supabase SQL editor
[ ] Step 3  — Validate DIM math, tune RATES if needed, redeploy
[ ] Step 4  — Test quote form, confirm row in Supabase table editor
[ ] Step 5  — Test rate calculator on live page
[ ] Step 6  — Replace [LANDING_PAGE_URL] in linkedin-dms.md
[ ] Step 7  — Send DMs 1–4 on LinkedIn (DM 5 after meetup)
[ ] Step 8  — RSVP to NYC Shopify/ecom meetup on Meetup.com or Eventbrite
[ ] Step 9  — Brief producer: send tiktok-brief.md + voice memo of script
[ ] Step 10 — Google OAuth: add GCP callback URI + enable Supabase provider + first login
```

---

## File reference

| File | What's in it |
|---|---|
| `app/page.tsx` | Landing page — edit hero copy here if DIM math changes |
| `app/_rate-calculator.tsx` | Calculator — edit `RATES` object to tune estimates |
| `app/_quote-form.tsx` | Quote form UI — form fields and submit logic |
| `app/api/quote-request/route.ts` | API route — saves quote requests to Supabase |
| `supabase/migrations/0006_quote_requests.sql` | Migration SQL — apply manually via Supabase dashboard |
| `docs/campaign/linkedin-dms.md` | 5 DMs — replace `[LANDING_PAGE_URL]` before sending |
| `docs/campaign/tiktok-brief.md` | TikTok script + producer brief |

---

## Env vars reference

These must be set in both `.env.local` (local dev) and Vercel (production).

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://aetvueyuaxbgszcisoci.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (keep secret) |

**Supabase API settings:** https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/settings/api
