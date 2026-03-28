# ILC BLOG PIPELINE — FIX FILE

**For:** Claude (Make.com MCP) or Yuriy (manual)
**Date:** March 28, 2026
**Status:** Broken — 92% error rate across generators, 20 scenarios (8 duplicates to delete)

-----

## CURRENT STATE: CHAOS

### What Exists (20 scenarios, folder 312379)

**KEEP (4 scenarios — the intended pipeline):**

| ID      | Name                                                   | Role                  | Status | Errors        |
|---------|--------------------------------------------------------|-----------------------|--------|---------------|
| 4640305 | Blog Content Generator — Phase 2 (Rotation + Tracking) | S1: GENERATE          | Active | 2/14 (14%)    |
| 4640124 | Blog Content Generator — SEO 85+                       | S2: GENERATE (alt)    | Active | 12/13 (92%)   |
| 4640738 | Blog Approve — Publish WP + GMB + Notify               | S3: APPROVE (webhook) | Active | 0/0           |
| 4642169 | Blog Auto-Publish — 9 AM PT Daily                      | S4: AUTO-PUBLISH      | Active | 0/2           |

**DELETE (16 failed experiments — all inactive or broken):**

| ID      | Name                                      | Why Delete                      |
|---------|-------------------------------------------|---------------------------------|
| 4640779 | Blog Auto-Publish — 9 AM If Not Approved  | Replaced by 4642169             |
| 4640582 | Blog Publisher — WordPress + Google Chat   | Replaced by S3/S4               |
| 4642472 | WP Connection Test                         | Test scenario                   |
| 4640569 | WordPress Test — Delete After              | Test scenario                   |
| 4642295 | Blog Generator — Test Run                  | Failed experiment (5/7 errors)  |
| 4642313 | Blog Generator — Core Pipeline             | Failed experiment (4/5 errors)  |
| 4642330 | Blog Generator — Full Pipeline             | Failed experiment (4/5 errors)  |
| 4642325 | Blog Generator v3                          | Failed experiment (2/2 errors)  |
| 4642394 | Blog Generator v5                          | Failed experiment (6/8 errors)  |
| 4642435 | Blog Generator — Final                     | Failed experiment (5/5 errors)  |
| 4642439 | Blog Generator — Live                      | Failed experiment (5/5 errors)  |
| 4642426 | Blog Generator — Production                | Failed experiment (5/5 errors)  |
| 4642457 | Blog Generator — Production (dupe)         | Failed experiment (6/12 errors) |
| 4642469 | Blog Generator — Restored                  | Failed experiment (7/7 errors)  |
| 4642447 | Blog Generator — Test v6                   | Failed experiment (6/6 errors)  |
| 4643446 | Blog Generator — Smart Topic Engine FINAL  | Failed experiment (1/2 errors)  |
| 4640588 | Publish Post — One-Time                    | One-time test (2/2 errors)      |

-----

## DIAGNOSIS: WHY IT'S BROKEN

### S1: Blog Content Generator — Phase 2 (ID: 4640305)

**Architecture:** Set Variable → Router → Route A (Current Events) / Route B (SEO/Repurpose)

**Problem 1: Route A never fires on useful content**

- Step 1 hardcodes `content_type = "news_update"`
- Route A filter requires `content_type == "immigration_topic" OR "news_update"` — this matches
- Route A fetches USCIS RSS + DOS Visa Bulletin
- GPT-4o generates article from RSS content
- **BUT:** USCIS RSS rarely has actionable content. Most runs produce generic filler or GPT falls back to evergreen topics — not the intended behavior.

**Problem 2: Route B never fires at all**

- Route B filter requires `content_type == "seo_article" OR "social_repurpose"`
- Since Step 1 hardcodes `content_type = "news_update"`, Route B **can never match**
- Route B reads from Airtable (base `apppdVL4bmoKhDX8G`, table `tblWHjZwE1tHlUSNn`) for curated topics
- This route is dead code — never executes

**Problem 3: No rotation logic**

- Scenario name says "Rotation + Tracking" but there's no rotation mechanism
- `content_type` is static, not cycling between news_update/seo_article/social_repurpose
- Should alternate between routes on different days

**Problem 4: Google Docs connection uses Yuriy's account (4628534)**

- Should use ILC Google Restricted (4687082) for consistency

**Problem 5: Tracking Sheet exists but no WP draft is created**

- Route A saves to Google Docs + Google Sheets
- Route A does NOT create a WordPress draft
- S3 and S4 both look for WP drafts — so S1 output never reaches S3/S4

### S2: Blog Content Generator — SEO 85+ (ID: 4640124)

**Architecture:** HTTP (USCIS RSS) → GPT-4o (title only) → WordPress (create draft) → Google Chat notify

**Problem 1: 92% error rate (12/13 runs)**

- Likely failing at WordPress module (connection 4719704) — need to verify connection is valid
- WordPress draft content is just `<p>Auto-generated draft — content pending</p>` — placeholder only, no real article body

**Problem 2: Title-only generation**

- GPT only generates a blog TITLE from RSS, not a full article
- Creates WP draft with placeholder body — useless as a published post
- S4 would auto-publish a placeholder with no content

**Problem 3: Google Chat webhook goes to a different space**

- Posts to `spaces/AAQAsoncCpA` — need to verify this is the right space (not the intake training or call monitor spaces)

### S3: Blog Approve — Publish WP + GMB + Notify (ID: 4640738)

**Architecture:** Webhook trigger → WordPress publish → GMB post → HTTP notify

**Status:** Active, 0 runs — never triggered because no one has used the webhook
**Packages:** gateway, wordpress, google-my-business, http
**Assessment:** Structurally correct. Will work once content flows into WP drafts.

### S4: Blog Auto-Publish — 9 AM PT Daily (ID: 4642169)

**Architecture:** HTTP (fetch WP drafts from last 4 hours) → Iterator → HTTP (publish each) → Google Chat notify

**Problem 1: 4-hour lookback window**

- Fetches drafts created in last 4 hours: `after={{formatDate(addHours(now; -4); ...)}}`
- S1 runs at 3 PM PT daily. S4 runs at 9 AM PT (next day = 16:00 UTC)
- Gap: S1 creates content at 3 PM, S4 looks back 4 hours from 9 AM = only sees drafts after 5 AM
- **S1's output is 18 hours before S4's window — it will never be found**

**Problem 2: Hardcoded WordPress credentials in Authorization header**

- `Basic ZGFpc3k6WnAyNiBSb1psIDc0YUogcThzbiA4a1VlIGxqQks=` (Daisy's WP app password)
- Should use a Make.com WordPress connection for maintainability

**Problem 3: Missing GMB cross-post**

- S3 (approve path) posts to GMB
- S4 (auto-publish path) does NOT post to GMB
- Auto-published content misses Google Business Profile entirely

-----

## FIX PLAN

### Phase 1: Clean Up (5 min)

1. **Deactivate** all 16 failed experiment scenarios listed in DELETE table
2. Optionally delete them (or move to archive folder)

### Phase 2: Fix S1 — Content Generator (ID: 4640305)

**Fix 2A: Add rotation logic**
Replace Step 1 (SetVariable) with logic that cycles content_type:

```
Day of week (Mon/Wed/Fri) → "news_update" (Route A)
Day of week (Tue/Thu) → "seo_article" (Route B)
Saturday → "social_repurpose" (Route B)
Sunday → OFF (don't run)
```

Implementation: Replace hardcoded `"news_update"` with:

```
{{if(contains("1,3,5"; toString(formatDate(now; "d"))); "news_update"; if(contains("2,4"; toString(formatDate(now; "d"))); "seo_article"; "social_repurpose"))}}
```

Where `formatDate(now; "d")` returns day of week (1=Monday, 7=Sunday).

**Fix 2B: Add WordPress draft creation to Route A**
After Step 9 (Google Sheets log), add:

- WordPress: Create Post (status: "draft", title: `{{6.title}}`, content: `{{7.value}}`)
  This connects S1 output to S3/S4 input.

**Fix 2C: Add WordPress draft creation to Route B**
After Step 16 (Google Sheets log), add same WordPress create draft module.

**Fix 2D: Verify Airtable data exists for Route B**

- Check base `apppdVL4bmoKhDX8G`, table `tblWHjZwE1tHlUSNn`
- Verify records exist with Status = "pending" and Content Type = "seo_article" or "social_repurpose"
- If table is empty, Route B will still produce nothing even after fixing the filter

**Fix 2E: Change Google Docs connection**

- Replace connection 4628534 (Yuriy Google) with 4687082 (ILC Google Restricted) on modules 8 and 15

### Phase 3: Fix or Replace S2 (ID: 4640124)

**Option A: Delete S2 entirely.** S1 already handles both content types. S2 is redundant — it only generates a title, not a full article. S1 is the better pipeline.

**Option B: Repurpose S2 as a "quick daily topic" generator** that:

1. Fetches RSS
2. Generates full article (not just title) via GPT-4o
3. Creates WP draft with real content
4. Notifies Google Chat

Recommendation: **Option A — delete S2.** One generator is enough. S1 with rotation handles everything.

### Phase 4: Fix S4 — Auto-Publish (ID: 4642169)

**Fix 4A: Expand lookback window**
Change `addHours(now; -4)` to `addHours(now; -24)` so it catches yesterday's S1 output.

**Fix 4B: Add GMB cross-post**
After module 3 (publish to WP), add Google My Business module matching S3's GMB configuration.

**Fix 4C: Replace hardcoded credentials**
Replace `Basic ZGFpc3k6...` header with a proper Make.com WordPress connection.

### Phase 5: Populate Airtable Topic Queue

For Route B to work, the Airtable table needs curated topics:

- Base: `apppdVL4bmoKhDX8G` (ILC – Meta Growth Engine)
- Table: `tblWHjZwE1tHlUSNn`
- Required fields: Topic, Target Keyword, Category, Content Type, Status (= "pending")
- Seed with 20-30 evergreen immigration topics for Las Vegas

-----

## TARGET END STATE

```
                    ┌─ Mon/Wed/Fri ─→ Route A (USCIS RSS + Visa Bulletin → GPT-4o → article)
S1 (daily 3PM) ──→ │
                    └─ Tue/Thu/Sat ──→ Route B (Airtable topic queue → GPT-4o → article)
                              │
                              ▼
                    Google Doc (archive) + Google Sheet (log) + WordPress Draft
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            S3 (webhook)         S4 (9AM auto-publish)
            Manual approve       If not approved by 9AM
                    │                   │
                    ▼                   ▼
            WP Publish + GMB     WP Publish + GMB
            + Google Chat        + Google Chat
```

**Success criteria:** One blog post published daily (Mon-Sat), either manually approved or auto-published, cross-posted to WordPress + Google My Business, with Google Chat notification.

-----

## CONNECTION REFERENCE

### WordPress
- Site: 702immigration.com
- Current WP connection in S2: ID 4719704 (verify if valid)
- Hardcoded credentials in S4: Daisy's app password (replace with connection)
- WP API base: `https://702immigration.com/wp-json/wp/v2/`

### Airtable
- Connection: 4608253
- Base: apppdVL4bmoKhDX8G (ILC – Meta Growth Engine)
- Table: tblWHjZwE1tHlUSNn
- Needs: Curated topic records with Status = "pending"

### OpenAI
- Connection: 4620111
- Model: gpt-4o
- Max tokens: 4000

### Google
- Google Docs/Sheets: Use 4687082 (ILC Google Restricted), NOT 4628534 (Yuriy)
- Tracking sheet: 1ERSf2Ln6qFKOO7sD5lwPfrAi3W1PfCXHqYHx1Z40ihQ

### Google Chat Webhooks
- S2 sends to: spaces/AAQAsoncCpA (verify — is this the right space?)
- S4 sends to: spaces/AAQAsoncCpA (same)
- Known spaces: Intake training = spaces/AAQA1vgpy6c, Call monitor = spaces/AAQAqgwbdhQ
