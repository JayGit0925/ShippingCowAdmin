# Campaign Go-Live Guide — Manhattan 50lb+

Everything Jay runs to get the landing page live, the quote form working, and outreach moving. In order. Do not skip steps.

---

## Pre-flight: Is the page deployed?

Check Vercel before starting anything else.

Go to: https://vercel.com/jiaweli0521-1285s-projects/shippingcow-admin

Wait for the build triggered by the last push to show **Ready** (green). Takes ~60 seconds. If it shows **Error**, check build logs before proceeding.

Once Ready, open: https://shippingcow-admin.vercel.app

You should see the landing page with the hero headline: **"Your 40-lb sofa ships at 40 lbs. Not 80."**

---

## Step 1: Apply the Supabase migration

The quote form returns a 500 error until the `quote_requests` table exists.

1. Go to: https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/sql
2. Click **New query**
3. Open the migration file: `supabase/migrations/0006_quote_requests.sql`
4. Paste the full contents into the SQL editor
5. Click **Run**
6. Expected output: `Success. No rows returned.`
7. Go to **Table Editor** → confirm `quote_requests` appears in the list

---

## Step 2: Validate the DIM math

The landing page claims "Your 40-lb sofa ships at 40 lbs. Not 80." and the calculator uses multipliers based on typical furniture. Verify these numbers hold against your actual rate structure before sending any DMs.

**Check the sofa example:**
- Your DIM divisor is 225 (vs standard 139)
- For a typical sofa box (e.g., 40"×24"×14" = 13,440 cu in):
  - Standard DIM: 13,440 ÷ 139 = **96 lbs billed**
  - ShippingCow DIM: 13,440 ÷ 225 = **60 lbs billed**
- The "80 lbs" claim needs a real sofa box where DIM at 139 ≈ 80 lbs
  - 80 × 139 = 11,120 cu in → e.g., 38"×22"×13.3" box
  - Same box at 225: 11,120 ÷ 225 = 49 lbs billed
  - If actual weight (40 lbs) < DIM at 225 (49 lbs), ShippingCow still bills 49, not 40
- **Decision:** If "40 lbs not 80" is directionally true (not exact), keep it as marketing copy. If it's wrong for your actual product, update the hero H1 in `app/page.tsx` to match a defensible example.

**Tune the calculator if needed:**
Open `app/_rate-calculator.tsx`. Find the `RATES` object (~line 10):
```typescript
const RATES = {
  zoneRatePerLb: [0, 0.21, 0.21, 0.26, 0.31, 0.37, 0.44, 0.50, 0.56],
  standardDimMultiplier: 2.0,
  shippingcowDimMultiplier: 1.25,
  standardResidential: 5.85,
  shippingcowResidential: 1.17,
  standardFuelPct: 0.13,
  shippingcowFuelPct: 0,
};
```
Update any values that don't match reality. Then rebuild and push:
```bash
cd projects/ShippingCowAdmin
git add app/_rate-calculator.tsx
git commit -m "fix(campaign): tune RATES constants to real-world values"
git push origin master
```
Wait for Vercel redeploy before testing.

---

## Step 3: Test the quote form end-to-end

1. Go to the live URL: https://shippingcow-admin.vercel.app
2. Scroll to **Get your actual rate** section (or click "Get My Rate →" in the nav)
3. Fill in test data:
   - Name: `Test User`
   - Company: `Test Store`
   - Email: `your-real-email@example.com`
   - Item type: `sofa`
   - Weight: `40`
   - Origin zip: `10001`
4. Click **Send My Quote Request →**
5. Expected: "Request sent." confirmation card appears
6. Go to Supabase → Table Editor → `quote_requests` → confirm the row is there

If you see an error message instead of the confirmation, check:
- Did Step 1 (migration) succeed? Check the Supabase Table Editor.
- Is `SUPABASE_SERVICE_ROLE_KEY` set in Vercel env vars? Go to Vercel → Project → Settings → Environment Variables.

---

## Step 4: Test the rate calculator

On the live landing page, scroll to **See Your Savings**.

1. Set weight to **40 lbs**, zone to **Zone 5 (avg US)**
2. Confirm: Standard Carrier tile shows a number in red, ShippingCow tile shows lower in green, YOU SAVE shows the delta in blue
3. Change weight to **80 lbs** — all three numbers should update
4. Change zone to **Zone 8** — savings should increase
5. Click **Get your exact rate →** link at the bottom — should scroll to the quote form

If numbers look off, go back to Step 2 and tune `RATES`.

---

## Step 5: Update the DM URL placeholder

Open `docs/campaign/linkedin-dms.md`.

Find every instance of `[LANDING_PAGE_URL]` and replace with:
```
https://shippingcow-admin.vercel.app
```

There are 5 DMs, each ending with the URL placeholder. Replace all 5.

Also update `[Event]` in DM 5 with the actual event name once you have one.

Save the file. (No need to commit — this is a working doc, not deployed code.)

---

## Step 6: Send the 5 LinkedIn DMs

Open `docs/campaign/linkedin-dms.md`.

For each DM:
1. Copy the text
2. Replace `[Name]` with the target's first name
3. For DM 3: replace `[Mutual]` with the mutual connection's name
4. For DM 5: replace `[Event]` with the event name (use once you have RSVP'd)
5. Send from LinkedIn

**Send DMs 1–4 first.** DM 5 (event follow-up) waits until you've attended a meetup.

Targets: Manhattan Shopify / TikTok Shop sellers, furniture or heavy home goods, 50lb+ items. Source from your existing ICP list at `daily/20260512-linkedin-dms.md` or the NYC ICP list in `daily/`.

---

## Step 7: Find and RSVP to a NYC event

Search on:
- **Meetup.com** — search "Shopify NYC", "ecommerce New York", "TikTok Shop sellers"
- **Eventbrite** — same search terms
- **LinkedIn Events** — filter by New York, e-commerce / retail

Look for events in the next 4 weeks (before W24, June 8).

Once you find one:
1. RSVP / register
2. Add to calendar
3. Update DM 5 in `docs/campaign/linkedin-dms.md` with the event name
4. Bring business cards or a QR code linking to the landing page

---

## Step 8: Brief the producer on TikTok

The full brief is at `docs/campaign/tiktok-brief.md`.

Send the producer:
1. The entire `tiktok-brief.md` file
2. A voice memo or loom of you reading Jay's script aloud (the 30s narration)
3. Note: they animate Scenes 1–3 while you record the voiceover separately — final cut combines both

Brand reference for the producer is in `brandguide/` in the repo root, plus the color/font notes at the bottom of `tiktok-brief.md`.

---

## Step 9: Google OAuth prereqs (if not done yet)

The admin portal login is broken until these two config steps are done.

**9a. Add callback URI to GCP**

Go to: https://console.cloud.google.com → APIs & Services → Credentials → your OAuth 2.0 Client

Under **Authorized redirect URIs**, add:
```
https://aetvueyuaxbgszcisoci.supabase.co/auth/v1/callback
```
Click **Save**.

**9b. Enable Google provider in Supabase**

Go to: https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/auth/providers

Find **Google** → toggle enabled → paste Client ID and Client Secret from GCP → **Save**.

**9c. First login + seed platform_admins**

1. Go to: https://shippingcow-admin.vercel.app/login
2. Click **Sign in with Google** → complete Google OAuth
3. Expected: redirected to `/403` (no admin row yet — correct)
4. Tell Claude to grab your new UUID from Supabase and insert the `platform_admins` row

---

## Checklist summary

| # | Action | Blocking? |
|---|---|---|
| 1 | Apply `0006_quote_requests.sql` | Yes — quote form 500s without it |
| 2 | Validate + tune DIM math / RATES | Yes — bad numbers = bad trust |
| 3 | Test quote form end-to-end | Yes — confirm pipeline works |
| 4 | Test calculator | No — confirm UX is correct |
| 5 | Update DM URL placeholder | Yes — before sending any DMs |
| 6 | Send 5 LinkedIn DMs | Core outreach — do today |
| 7 | RSVP to NYC meetup | This week |
| 8 | Brief producer on TikTok | This week — lead time for production |
| 9 | Google OAuth prereqs | Unblocks admin portal login |
