import { db } from "../src/lib/db"
import { parseTemplate } from "../src/lib/template-parser"

const SAMPLE_TEMPLATES = [
  {
    stage: "production" as const,
    priority: "critical" as const,
    template: `## Jira Summary
\`[Bug][Auth] Cannot login with valid credentials\`

## Overview
IB4G (Production) > Logged Out > Web > Login Page > Submit > Error

## Environment
App: IB4G (Production)
Page: Auth > Login
Platform: Web
OS: Windows
Browser: Chrome

## Preconditions
- User has a valid account
- User is on the login page

## Steps to Reproduce
1. Navigate to https://app.ib4g.example/login
2. Enter a valid email address
3. Enter the correct password
4. Click the Login button

## Actual Result
A 500 Internal Server Error is displayed and the user remains on the login page.

## Expected Result
User is redirected to the dashboard after successful authentication.

## Impact
**User Impact:**
- No user can log into the production system
- Existing sessions eventually expire and cannot be renewed

**Business Impact:**
- All paying customers are blocked from the product
- Estimated $12k revenue loss per hour of downtime

**QA Impact:**
- Regression suite for auth flow is fully blocked
- Cannot verify any downstream user flows

## Technical Notes
POST /api/auth/login returns 500. Stack trace points to the JWT signing middleware — likely an expired signing key. Check KEYCLOAK_SIGNING_KEY rotation.`,
  },
  {
    stage: "staging" as const,
    priority: "high" as const,
    template: `## Jira Summary
\`[Bug][Payments] Checkout fails for Amex cards on Safari\`

## Overview
IB4G (Staging) > Logged In > Web > Checkout > Pay > Card Declined

## Environment
App: IB4G (Staging)
Page: Checkout > Payment
Platform: Web
OS: macOS
Browser: Safari

## Preconditions
- User is logged in
- Cart has at least one item
- User selects American Express as payment method

## Steps to Reproduce
1. Add an item to the cart
2. Proceed to checkout
3. Select credit card payment
4. Choose card type "American Express"
5. Enter a valid Amex test card number
6. Click Pay Now

## Actual Result
The spinner spins indefinitely and the payment never completes. No error is shown to the user.

## Expected Result
Payment is processed and the user sees the success confirmation page.

## Impact
**User Impact:**
- Amex users cannot complete purchases on Safari
- Users may abandon the cart

**Business Impact:**
- ~8% of transactions use Amex; potential revenue impact on that segment

**QA Impact:**
- Payment regression for Amex + Safari combination fails

## Technical Notes
Stripe.js iframe fails to mount on Safari due to a Content-Security-Policy issue. The frame-ancestors directive needs to be updated for the staging domain.`,
  },
  {
    stage: "dev" as const,
    priority: "medium" as const,
    template: `## Jira Summary
\`[Bug][UI] Dark mode toggle has no effect on the settings page\`

## Overview
IB4G (Dev) > Logged In > Web > Settings > Toggle Theme > No Change

## Environment
App: IB4G (Dev)
Page: Settings > Appearance
Platform: Web
OS: Linux
Browser: Firefox

## Preconditions
- User is logged in
- User is on the Settings > Appearance page

## Steps to Reproduce
1. Open Settings
2. Go to Appearance
3. Toggle the Dark Mode switch

## Actual Result
The switch flips but the page colors do not change.

## Expected Result
The page immediately switches to dark mode.

## Impact
**User Impact:**
- Users who prefer dark mode cannot use it on this page

**Business Impact:**
- Minor; cosmetic only

**QA Impact:**
- Theme regression test for settings page fails

## Technical Notes
The ThemeProvider context is not wrapped around the Settings route segment. Move the provider up to the layout.`,
  },
  {
    stage: "production" as const,
    priority: "high" as const,
    template: `## Jira Summary
\`[Bug][Search] Search results return stale data after content update\`

## Overview
IB4G (Production) > Logged In > Web > Search > Submit > Stale Results

## Environment
App: IB4G (Production)
Page: Search
Platform: Web
OS: macOS
Browser: Chrome

## Preconditions
- User is logged in
- New content was published in the last 10 minutes

## Steps to Reproduce
1. Publish a new article via the CMS
2. Wait 1 minute
3. Use the global search bar to search for the new article title

## Actual Result
The new article does not appear in search results until ~15 minutes later.

## Expected Result
Search index updates within 30 seconds of publication.

## Impact
**User Impact:**
- Users cannot find freshly published content via search

**Business Impact:**
- Time-sensitive content (news) loses early engagement

**QA Impact:**
- Search freshness SLO is violated

## Technical Notes
Elasticsearch reindex cron runs every 15 minutes. Move to a queue-based reindex on publish event.`,
  },
  {
    stage: "staging" as const,
    priority: "low" as const,
    template: `## Jira Summary
\`[Bug][UI] Tooltip overlaps with the footer on small screens\`

## Overview
IB4G (Staging) > Logged In > Web > Dashboard > Hover Icon > Tooltip Overflow

## Environment
App: IB4G (Staging)
Page: Dashboard
Platform: Web
OS: iOS
Browser: Safari

## Preconditions
- User is on a mobile device (width < 640px)
- User is on the dashboard

## Steps to Reproduce
1. Open the dashboard on a small screen
2. Long-press the info icon next to the "Total Revenue" card

## Actual Result
The tooltip extends below the viewport and overlaps with the footer.

## Expected Result
The tooltip flips above the icon when there is not enough space below.

## Impact
**User Impact:**
- Tooltip text is partially unreadable on mobile

**Business Impact:**
- Negligible

**QA Impact:**
- Mobile tooltip regression

## Technical Notes
Radix Popover does not have collisionPadding set. Add collisionPadding={{ bottom: 16 }} and avoidCollisions.`,
  },
  {
    stage: "dev" as const,
    priority: "medium" as const,
    template: `## Jira Summary
\`[Bug][API] GET /api/users returns 401 for valid admin tokens\`

## Overview
IB4G (Dev) > Logged In > API > /api/users > GET > 401 Unauthorized

## Environment
App: IB4G (Dev)
Page: API > Users
Platform: API
OS: Server
Browser: N/A

## Preconditions
- Caller has a valid admin JWT
- Caller hits GET /api/users

## Steps to Reproduce
1. Obtain an admin JWT via POST /api/auth/login
2. Send GET /api/users with Authorization: Bearer <token>

## Actual Result
Server returns 401 Unauthorized with body { error: "invalid_role" }.

## Expected Result
Server returns 200 with the list of users.

## Impact
**User Impact:**
- Admins cannot manage users via the API

**Business Impact:**
- Internal tooling blocked in dev

**QA Impact:**
- Admin API integration tests fail

## Technical Notes
The role check middleware reads req.user.role but the JWT decoder now stores it under req.user.permissions[]. Update the guard.`,
  },
  {
    stage: "production" as const,
    priority: "critical" as const,
    template: `## Jira Summary
\`[Bug][Infra] Database connection pool exhausted under load\`

## Overview
IB4G (Production) > System > API Gateway > High Load > Pool Exhausted

## Environment
App: IB4G (Production)
Page: All
Platform: API
OS: Server
Browser: N/A

## Preconditions
- Sustained traffic above 800 req/s
- Pool size configured to 20

## Steps to Reproduce
1. Run load test with 1000 virtual users
2. Sustain for 60 seconds
3. Monitor API error rate

## Actual Result
~12% of requests return 503 with "pool exhausted" after ~40s.

## Expected Result
All requests are served within 2s p95.

## Impact
**User Impact:**
- Intermittent 503 errors during traffic spikes

**Business Impact:**
- Marketing campaigns trigger outages; lost conversion events

**QA Impact:**
- Load test SLO not met

## Technical Notes
PgBouncer transaction-mode pool is misconfigured. Switch to session pool for the write-heavy workers and add a separate read replica.`,
  },
  {
    stage: "staging" as const,
    priority: "low" as const,
    template: `## Jira Summary
\`[Bug][i18n] German translation missing for Save button\`

## Overview
IB4G (Staging) > Logged In > Web > Profile > Edit > Save > English Label

## Environment
App: IB4G (Staging)
Page: Profile > Edit
Platform: Web
OS: Windows
Browser: Chrome

## Preconditions
- Browser language is set to de-DE
- User is on the profile edit page

## Steps to Reproduce
1. Set browser locale to German
2. Open Profile > Edit
3. Inspect the Save button label

## Actual Result
Button shows "Save" (English fallback).

## Expected Result
Button shows "Speichern".

## Impact
**User Impact:**
- Minor inconsistency for German users

**Business Impact:**
- Negligible

**QA Impact:**
- i18n coverage gap

## Technical Notes
Missing key profile.edit.save in de.json. Add it and rebuild locale bundle.`,
  },
]

const SAMPLE_LABELS = [
  { name: "auth", color: "rose" },
  { name: "payments", color: "emerald" },
  { name: "ui", color: "violet" },
  { name: "api", color: "cyan" },
  { name: "infra", color: "orange" },
  { name: "i18n", color: "amber" },
  { name: "search", color: "teal" },
  { name: "regression", color: "fuchsia" },
]

async function seed() {
  console.log("Seeding labels...")
  const labels = await Promise.all(
    SAMPLE_LABELS.map((l) =>
      db.label.upsert({
        where: { name: l.name },
        update: { color: l.color },
        create: l,
      }),
    ),
  )
  console.log(`  -> ${labels.length} labels ready`)

  console.log("Seeding bugs...")
  let created = 0
  for (const sample of SAMPLE_TEMPLATES) {
    const parsed = parseTemplate(sample.template)
    const existing = parsed.jiraId
      ? await db.bug.findFirst({ where: { jiraId: parsed.jiraId } })
      : null
    if (existing) {
      console.log(`  -> skip ${parsed.jiraId} (already exists)`)
      continue
    }
    const labelNames: string[] = []
    if (parsed.summary.includes("login")) labelNames.push("auth", "api")
    else if (parsed.summary.includes("Checkout") || parsed.summary.includes("Amex")) labelNames.push("payments")
    else if (parsed.summary.includes("Dark mode") || parsed.summary.includes("Tooltip")) labelNames.push("ui")
    else if (parsed.summary.includes("Search results")) labelNames.push("search")
    else if (parsed.summary.includes("Database") || parsed.summary.includes("pool")) labelNames.push("infra")
    else if (parsed.summary.includes("German")) labelNames.push("i18n")
    else if (parsed.summary.includes("/api/users")) labelNames.push("api")
    labelNames.push("regression")

    const labelIds = labels
      .filter((l) => labelNames.includes(l.name))
      .map((l) => l.id)

    await db.bug.create({
      data: {
        jiraId: parsed.jiraId,
        summary: parsed.summary,
        overviewLoginCondition: parsed.overviewLoginCondition,
        overviewPlatform: parsed.overviewPlatform,
        overviewModule: parsed.overviewModule,
        overviewTrigger: parsed.overviewTrigger,
        overviewIssue: parsed.overviewIssue,
        envPage: parsed.envPage,
        envPlatform: parsed.envPlatform,
        envOS: parsed.envOS,
        envBrowser: parsed.envBrowser,
        preconditions: JSON.stringify(parsed.preconditions),
        stepsToReproduce: JSON.stringify(parsed.stepsToReproduce),
        actualResult: parsed.actualResult,
        expectedResult: parsed.expectedResult,
        userImpact: parsed.userImpact,
        businessImpact: parsed.businessImpact,
        qaImpact: parsed.qaImpact,
        technicalNotes: parsed.technicalNotes,
        environmentStage: sample.stage,
        status: "open",
        priority: sample.priority,
        reporter: "QA Bot",
        labels: { create: labelIds.map((labelId) => ({ labelId })) },
      },
    })
    created++
  }
  console.log(`  -> ${created} bugs created`)
  console.log("Done.")
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
