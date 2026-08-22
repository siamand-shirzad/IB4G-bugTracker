/**
 * Reseed script — drops all bugs/events/labels and recreates them with
 * realistic timestamps spread over the last 30 days so dashboard trend
 * charts and activity timelines look alive.
 *
 * Usage: bun run scripts/reseed.ts
 */
import { db } from "../src/lib/db"
import { parseTemplate } from "../src/lib/template-parser"

// Each sample: template + stage + priority + daysAgo (when created) + closedAfterDays? (null = still open)
const SAMPLES: {
  stage: "dev" | "staging" | "production"
  priority: "low" | "medium" | "high" | "critical"
  daysAgoCreated: number
  closedAfterDays?: number
  assignee?: string
  template: string
}[] = [
  {
    stage: "production",
    priority: "critical",
    daysAgoCreated: 18,
    closedAfterDays: 3,
    assignee: "Sara Chen",
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
    stage: "staging",
    priority: "high",
    daysAgoCreated: 12,
    closedAfterDays: 4,
    assignee: "Marco Diaz",
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
    stage: "dev",
    priority: "medium",
    daysAgoCreated: 6,
    closedAfterDays: 2,
    assignee: "Priya Nair",
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
    stage: "production",
    priority: "high",
    daysAgoCreated: 9,
    assignee: "Marco Diaz",
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
    stage: "staging",
    priority: "low",
    daysAgoCreated: 14,
    closedAfterDays: 5,
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
    stage: "dev",
    priority: "medium",
    daysAgoCreated: 3,
    assignee: "Sara Chen",
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
    stage: "production",
    priority: "critical",
    daysAgoCreated: 1,
    assignee: "unassigned",
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
    stage: "staging",
    priority: "low",
    daysAgoCreated: 21,
    closedAfterDays: 6,
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
  // Extra bugs to populate the trend chart with more data points
  {
    stage: "production",
    priority: "medium",
    daysAgoCreated: 25,
    closedAfterDays: 8,
    assignee: "Priya Nair",
    template: `## Jira Summary
\`[Bug][Notifications] Email digests sent to unsubscribed users\`

## Overview
IB4G (Production) > System > Cron > Daily Digest > Send > Wrong Audience

## Environment
App: IB4G (Production)
Page: N/A
Platform: API
OS: Server
Browser: N/A

## Preconditions
- User has unsubscribed from email digests
- Daily digest cron runs at 09:00 UTC

## Steps to Reproduce
1. Unsubscribe a test user from digests
2. Wait for the 09:00 UTC cron run
3. Check the user's inbox

## Actual Result
Digest email is sent despite the unsubscribe preference.

## Expected Result
No digest email is sent to unsubscribed users.

## Impact
**User Impact:**
- Unsubscribed users receive unwanted email

**Business Impact:**
- CAN-SPAM/GDPR compliance risk

**QA Impact:**
- Email preference regression

## Technical Notes
The digest query reads from the users table but ignores the email_preferences.unsubscribed_digest flag. Add a WHERE clause.`,
  },
  {
    stage: "staging",
    priority: "high",
    daysAgoCreated: 7,
    assignee: "Sara Chen",
    template: `## Jira Summary
\`[Bug][Auth] OAuth callback redirects to wrong URL on mobile\`

## Overview
IB4G (Staging) > Logged Out > Mobile > OAuth Callback > Redirect > Wrong URL

## Environment
App: IB4G (Staging)
Page: Auth > OAuth Callback
Platform: Mobile
OS: Android
Browser: Chrome

## Preconditions
- User initiates Google OAuth login from the mobile app
- OAuth provider redirects back to the app

## Steps to Reproduce
1. Open the mobile app
2. Tap "Sign in with Google"
3. Complete the OAuth flow on the provider's page
4. Observe the redirect

## Actual Result
The redirect goes to the web production URL instead of the deep link, opening a browser tab.

## Expected Result
The redirect uses the configured mobile deep link (ib4g://auth/callback).

## Impact
**User Impact:**
- Mobile users land in a browser instead of the app after login

**Business Impact:**
- Mobile conversion drop; users must re-authenticate in-app

**QA Impact:**
- Mobile OAuth E2E test fails

## Technical Notes
The callback URL resolver checks the User-Agent but the mobile app's WebView reports as desktop Chrome. Use a client_type query param instead.`,
  },
  {
    stage: "dev",
    priority: "low",
    daysAgoCreated: 4,
    closedAfterDays: 1,
    template: `## Jira Summary
\`[Bug][UI] Footer overlaps content when keyboard opens on iOS\`

## Overview
IB4G (Dev) > Logged In > Mobile > Comment Box > Focus > Footer Overlap

## Environment
App: IB4G (Dev)
Page: Any with a comment box
Platform: Mobile
OS: iOS
Browser: Safari

## Preconditions
- User is on a mobile device
- Page has a sticky footer + a text input

## Steps to Reproduce
1. Open a bug detail page on iOS Safari
2. Tap the comment box

## Actual Result
The virtual keyboard pushes the footer up over the input.

## Expected Result
The viewport resizes and the footer stays below the input.

## Impact
**User Impact:**
- Cannot see what they are typing on iOS

**Business Impact:**
- Negligible

**QA Impact:**
- iOS keyboard regression

## Technical Notes
Use the VisualViewport API to detect keyboard and adjust the footer position. Or use position: sticky with env(safe-area-inset-bottom).`,
  },
  {
    stage: "production",
    priority: "medium",
    daysAgoCreated: 16,
    closedAfterDays: 10,
    assignee: "Marco Diaz",
    template: `## Jira Summary
\`[Bug][Reports] CSV export truncates long summaries at commas\`

## Overview
IB4G (Production) > Logged In > Web > Reports > Export > CSV > Truncated

## Environment
App: IB4G (Production)
Page: Reports
Platform: Web
OS: macOS
Browser: Chrome

## Preconditions
- User has a report with summaries containing commas
- User clicks "Export as CSV"

## Steps to Reproduce
1. Open Reports
2. Click Export as CSV
3. Open the file in Excel

## Actual Result
Summaries containing commas are split across multiple columns.

## Expected Result
Commas inside a summary should be quoted so the summary stays in one column.

## Impact
**User Impact:**
- Exported reports are misaligned in Excel

**Business Impact:**
- Analysts lose trust in exported data

**QA Impact:**
- CSV export unit test missing edge case

## Technical Notes
The CSV writer does not wrap fields in double quotes. Implement RFC 4180 quoting (escape " as "").`,
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
  { name: "notifications", color: "sky" },
  { name: "reports", color: "lime" },
]

function pickLabelNames(summary: string): string[] {
  const names: string[] = []
  const s = summary.toLowerCase()
  if (s.includes("login") || s.includes("oauth") || s.includes("auth")) names.push("auth", "api")
  else if (s.includes("checkout") || s.includes("amex") || s.includes("payments")) names.push("payments")
  else if (s.includes("dark mode") || s.includes("tooltip") || s.includes("footer") || s.includes("keyboard")) names.push("ui")
  else if (s.includes("search results") || s.includes("search")) names.push("search")
  else if (s.includes("database") || s.includes("pool") || s.includes("infra")) names.push("infra")
  else if (s.includes("german") || s.includes("i18n") || s.includes("translation")) names.push("i18n")
  else if (s.includes("/api/users") || s.includes("api")) names.push("api")
  else if (s.includes("email") || s.includes("digest") || s.includes("notifications")) names.push("notifications")
  else if (s.includes("csv") || s.includes("export") || s.includes("reports")) names.push("reports")
  names.push("regression")
  return Array.from(new Set(names))
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(9 + (days % 8), (days * 7) % 60, 0, 0)
  return d
}

async function reseed() {
  console.log("⚠️  Wiping existing data...")
  await db.bugEvent.deleteMany()
  await db.bugLabel.deleteMany()
  await db.bug.deleteMany()
  await db.label.deleteMany()
  console.log("  -> wiped")

  console.log("Seeding labels...")
  const labels = await Promise.all(
    SAMPLE_LABELS.map((l) => db.label.create({ data: l })),
  )
  console.log(`  -> ${labels.length} labels created`)

  console.log("Seeding bugs with realistic timestamps...")
  let created = 0
  let closed = 0
  for (const sample of SAMPLES) {
    const parsed = parseTemplate(sample.template)
    const createdAt = daysAgo(sample.daysAgoCreated)
    const isClosed = sample.closedAfterDays !== undefined
    const closedAt = isClosed
      ? daysAgo(sample.daysAgoCreated - (sample.closedAfterDays as number))
      : undefined

    const labelNames = pickLabelNames(parsed.summary)
    const labelIds = labels
      .filter((l) => labelNames.includes(l.name))
      .map((l) => l.id)

    const bug = await db.bug.create({
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
        status: isClosed ? "closed" : "open",
        priority: sample.priority,
        assignee: sample.assignee && sample.assignee !== "unassigned" ? sample.assignee : null,
        reporter: "QA Bot",
        createdAt,
        updatedAt: closedAt ?? createdAt,
        labels: { create: labelIds.map((labelId) => ({ labelId })) },
      },
    })

    // Record creation event
    await db.bugEvent.create({
      data: {
        bugId: bug.id,
        type: "created",
        summary: `Bug report created${bug.jiraId ? ` (${bug.jiraId})` : ""}`,
        actor: "QA Bot",
        createdAt,
      },
    })

    // If closed, record a status_changed event + a priority adjustment for variety
    if (isClosed && closedAt) {
      await db.bugEvent.create({
        data: {
          bugId: bug.id,
          type: "status_changed",
          field: "status",
          oldValue: "open",
          newValue: "closed",
          actor: sample.assignee && sample.assignee !== "unassigned" ? sample.assignee : "QA Bot",
          summary: "Status changed from open to closed",
          createdAt: closedAt,
        },
      })
      closed++
    }
    created++
  }
  console.log(`  -> ${created} bugs created (${closed} closed, ${created - closed} open)`)

  console.log("Re-seed complete.")
}

reseed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
