# IB4G BugTracker — Worklog & Handover Document

## Project Status (as of initial build)

**Status: ✅ Fully functional — v1.0.0 complete and browser-verified**

The IB4G BugTracker is a structured bug-report management system based on the IB4G Jira template.
Users paste a Jira-style template into a single textarea and the system auto-parses 16+ structured
fields (overview breadcrumb, environment, preconditions, steps, actual/expected results, 3-tier
impact analysis, technical notes) into a normalized database.

The project was built from a fresh Next.js 16 scaffold — no prior bug-tracker code existed.
The entire application (schema, parser, API, hooks, store, 14 UI components) was implemented
in a single session and verified end-to-end with `agent-browser`.

### Tech stack (as built)
- Next.js 16 (App Router) + TypeScript 5 + Turbopack
- Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- Prisma 6 + **SQLite** (local file at `db/custom.db`) — note: user spec mentioned Supabase/Postgres,
  but the sandbox ships with SQLite; the Prisma schema is provider-agnostic and can be swapped to
  Postgres by changing the `datasource` block + `DATABASE_URL`.
- TanStack Query (server state) + Zustand (client state / navigation / filters)
- Recharts (dashboard charts) + react-markdown + date-fns + sonner (toasts) + next-themes

---

## What was built (completed modifications)

### 1. Data layer
- `prisma/schema.prisma` — `Bug` (27 fields incl. overview/env/impact/stage/status/priority),
  `Label`, `BugLabel` (many-to-many). Indexes on status/priority/stage/updatedAt.
- `src/lib/db.ts` — Prisma singleton (log level reduced to `error`/`warn`).
- `scripts/seed.ts` — Seeds 8 realistic sample bug reports + 8 colored labels.

### 2. Core engine — `src/lib/template-parser.ts`
- `parseTemplate(raw)` — splits `## Section` headers, parses:
  - Jira Summary → extracts `[A-Z]+-\d+` Jira ID + strips `[Bug][Tag]` prefixes
  - Overview breadcrumb (`A > B > C > D > E > F`) → loginCondition / platform / module / trigger / issue
  - Environment (`Key: Value` lines) → envPage / envPlatform / envOS / envBrowser
  - Preconditions (`-` bullets), Steps to Reproduce (`1.` numbered)
  - Actual / Expected Result (free text)
  - Impact → 3 subsections (User / Business / QA) via `###` or `**Label:**` or `Label:` headers;
    falls back to treating the whole block as userImpact if no subsections detected
  - Technical Notes (free text / code)
- `reconstructTemplate(bug)` — rebuilds the original template text from stored DB fields
  (used by the "Copy template" button in the detail view).
- `reconstructOverviewBreadcrumb(...)` — rebuilds the `>`-joined breadcrumb.

### 3. API (11 routes, all Zod-validated)
- `GET /api/info` — app metadata + endpoint list + env vars
- `GET /api/bugs` — list with filters (search, status, priority, platform, stage, assignee,
  labelId, page, pageSize) + pagination metadata
- `POST /api/bugs` — create; accepts a raw `overview` template string and auto-parses it
  (explicit fields override parsed ones)
- `GET/PUT/DELETE /api/bugs/[id]` — single-bug CRUD; PUT supports partial updates and
  re-parsing if a new `overview` is supplied; labelIds replace the label set
- `GET /api/bugs/stats` — dashboard aggregates (total/open/closed/critical, byStatus,
  byPriority, byStage, byPlatform, recent 5)
- `GET/POST /api/labels` + `GET/PUT/DELETE /api/labels/[id]` — label CRUD with unique-name
  constraint handling

### 4. Client state
- `src/hooks/use-bugs.ts` — 8 TanStack Query hooks (list, detail, stats, create/update/delete
  bug, labels CRUD, app info) with optimistic invalidation + sonner toasts.
- `src/store/bug-store.ts` — Zustand store: active view, selected bug id, sidebar collapse,
  mobile sheet open, bug-list filters (debounced search handled in the list view), labels cache,
  form-dialog state (create vs edit mode).

### 5. UI (14 components in `src/components/bugs/`)
- **Badges**: `status-badge`, `priority-badge`, `stage-badge`, `label-badge` — all theme-aware
  with colored dots + semantic Tailwind classes (no indigo/blue).
- **Form**: `bug-form` (Title / Jira ID / Stage toggles / Priority toggles / Overview textarea
  with live-parse preview popover / Label picker) + `bug-form-dialog` (create/edit wrapper).
- **Views**:
  - `dashboard-view` — 4 stat cards + 3 charts (status bar, priority donut, stage donut with
    center totals + legends) + recent-activity list
  - `bug-list-view` — filter bar (debounced search + 4 selects) + table (responsive column
    hiding) + pagination + "Export all" (copies title+id to clipboard)
  - `bug-detail-view` — header (badges + Jira ID + actions) + 9 content cards (Overview
    breadcrumb, Environment grid, Preconditions, Steps, Actual/Expected, Impact Analysis with
    3 sub-sections, Technical Notes code block) + sidebar (Quick Edit for status/priority/stage,
    Labels, Quick Info) + Copy-template + Delete confirm
  - `info-view` — 6 metadata cards + endpoints table (method-colored badges + copy buttons) +
    env-vars list + 5-step setup guide
  - `labels-view` — responsive grid of label cards with inline edit + create/delete dialogs
- **Layout**: `app-sidebar` (collapsible 60px↔224px, nav + theme toggle + collapse button) +
  `app-content` (desktop sidebar + mobile Sheet + scrollable main + global form dialog).

### 6. Styling & UX
- Light/dark themes via `next-themes` (ThemeProvider in layout).
- Custom scrollbar styling + fade-in / slide-in animations in `globals.css`.
- Semantic color system: amber (open), emerald (closed), rose (critical), orange (high),
  sky (medium), slate (low), violet (dev), cyan (staging), red (production).
- Mobile-first responsive: hamburger → Sheet sidebar; table columns hide progressively.
- Sticky app shell (`h-screen` + internal scroll) — no floating-footer issue.

---

## Verification results

Verified end-to-end with `agent-browser` at 1440×900 desktop + iPhone 14 mobile:

| Flow | Result |
|------|--------|
| Dashboard renders (4 stat cards, 3 charts, 5 recent bugs) | ✅ |
| Bug list loads 8 bugs with badges + pagination | ✅ (after fixing `labelId=all` filter bug) |
| Bug detail shows all 9 cards + Quick Edit sidebar | ✅ |
| New-bug form: Template popover → "Use template" → live-parse preview (16 fields) | ✅ |
| Form submission → POST 201 → bug appears at top of list | ✅ |
| Created bug's detail shows all auto-parsed fields correctly | ✅ |
| Labels view: 8 labels with colors + edit/delete | ✅ |
| Endpoints view: 6 metadata cards + 11-route table + setup guide | ✅ |
| Dark mode toggle (html class switches to `dark`) | ✅ |
| Mobile: hamburger opens Sheet sidebar; nav closes sheet | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| Console / runtime errors | ✅ none |

### Bug fixed during verification
- `use-bugs.ts` was sending `labelId=all` to the API, which the backend interpreted as a literal
  label-ID filter and returned an empty list. Fixed by skipping the param when value is `"all"`.

---

## Unresolved issues / risks

None blocking. Minor notes for future iterations:

1. **Database provider** — currently SQLite (sandbox default). To move to Supabase/Postgres as
   the original spec mentions, change `datasource db { provider = "postgresql" }` in
   `prisma/schema.prisma`, set `DATABASE_URL`, and run `bun run db:push`. The schema is
   already Postgres-compatible (no SQLite-specific types used).
2. **Auth** — not implemented. `reporter` defaults to `"Anonymous"`. NextAuth.js v4 is installed
   and available if user accounts become needed.
3. **Search** — uses SQL `contains` (case-sensitive on SQLite). For full-text search, consider
   a `FTS5` virtual table or migrating to Postgres `tsvector`.
4. **Real-time** — no WebSocket; lists rely on TanStack Query refetch/staleTime. A socket.io
   mini-service could be added for live updates (infrastructure is documented in the system prompt).
5. **Export** — currently copies title+id to clipboard. A CSV/JSON download would be a nice add.
6. **Assignee** — stored as a plain string; no user picker UI yet.

---

## Priority recommendations for the next phase

1. **Polish**: add empty-state illustrations, keyboard shortcuts (e.g. `n` for new bug, `/` to
   focus search), and a command-palette (cmdk is already installed).
2. **Bulk actions**: multi-select rows in the bug list → bulk status/priority change, bulk delete,
   bulk label assignment.
3. **Activity log / audit trail**: track status/priority changes over time (new `BugEvent` model).
4. **CSV/JSON export + import**: let users bulk-import bugs from a template file.
5. **Saved filters / views**: persist filter presets per user.
6. **Assignee management**: simple user list + assignee filter + avatar display.
7. **Richer charts**: trend over time (bugs opened vs closed per day), platform breakdown chart
   on the dashboard.

---

## File map (custom code)

```
prisma/schema.prisma                      ← Bug / Label / BugLabel models
scripts/seed.ts                           ← 8 sample bugs + 8 labels
src/app/layout.tsx                        ← ThemeProvider + fonts + toast
src/app/page.tsx                          ← QueryClientProvider + AppContent
src/app/globals.css                       ← scrollbar + animations + selection
src/app/api/info/route.ts                 ← GET app info
src/app/api/bugs/route.ts                 ← GET list + POST create
src/app/api/bugs/[id]/route.ts            ← GET + PUT + DELETE
src/app/api/bugs/stats/route.ts           ← GET dashboard stats
src/app/api/labels/route.ts               ← GET + POST
src/app/api/labels/[id]/route.ts          ← PUT + DELETE
src/lib/types.ts                          ← all TS interfaces
src/lib/constants.ts                      ← status/priority/stage/label config + sidebar items
src/lib/db.ts                             ← Prisma singleton
src/lib/serialize.ts                      ← Prisma row → API shape (parses JSON arrays)
src/lib/template-parser.ts                ← 🔥 parse + reconstruct engine
src/hooks/use-bugs.ts                     ← 8 TanStack Query hooks
src/store/bug-store.ts                    ← Zustand store
src/components/theme-provider.tsx         ← next-themes wrapper
src/components/bugs/app-content.tsx       ← shell: sidebar + main + mobile sheet + form dialog
src/components/bugs/app-sidebar.tsx       ← collapsible nav + theme toggle
src/components/bugs/dashboard-view.tsx    ← 4 stat cards + 3 charts + recent
src/components/bugs/bug-list-view.tsx     ← filters + table + pagination + export
src/components/bugs/bug-detail-view.tsx   ← 9 cards + Quick Edit sidebar
src/components/bugs/bug-form.tsx          ← 5 inputs + template popover + live preview
src/components/bugs/bug-form-dialog.tsx   ← create/edit dialog wrapper
src/components/bugs/info-view.tsx         ← metadata + endpoints + setup guide
src/components/bugs/labels-view.tsx       ← label CRUD grid
src/components/bugs/status-badge.tsx
src/components/bugs/priority-badge.tsx
src/components/bugs/stage-badge.tsx
src/components/bugs/label-badge.tsx
```

---

## How to run

```bash
bun run dev          # http://localhost:3000 (dev server, auto-restart)
bun run lint         # ESLint
bun run db:push      # apply schema changes
bun run scripts/seed.ts   # (re)seed sample data
```

The dev server is currently running in the background and the database is seeded with 8 sample
bug reports + 8 labels.

---

# Round 2 — Feature Expansion & Styling Polish (Task ID: 2)

## Current status assessment (start of round)

The v1.0.0 build from Round 1 was verified healthy: dev server returning 200 on all routes,
no console/runtime errors, all 4 views rendering. No bugs to fix — the project was stable.

Per the mandatory requirements (improve styling + add features), this round focused on
high-value feature additions and visual polish.

## Goals for this round

1. **Activity log / audit trail** — track every bug change with a timeline UI
2. **Bulk actions** — multi-select rows in the bug list with a bulk toolbar
3. **CSV/JSON export & JSON import** — real file download (not just clipboard) + paste-JSON import
4. **Command palette** (⌘K / Ctrl+K) — quick navigation + actions via cmdk
5. **Keyboard shortcuts** — `n`, `/`, `?`, `g d/b/l/e`, `Esc`, `⌘K`
6. **Saved filters** — persist filter presets to localStorage
7. **Dashboard trend chart** — opened vs closed over 14 days (area chart with gradients)
8. **Styling polish** — empty states, stagger animations, footer, KPI accent bars

## Completed modifications

### New Prisma model + APIs
- **`prisma/schema.prisma`** — added `BugEvent` model (id, bugId, type, field, oldValue, newValue,
  actor, summary, createdAt) with indexes on `[bugId, createdAt]` and `[createdAt]`. Added
  `events BugEvent[]` relation to `Bug`.
- **`src/lib/events.ts`** — `recordEvent()` + `recordDiffEvents()` helpers that diff before/after
  bug rows and emit one event per changed tracked field (status, priority, stage, assignee,
  summary, jiraId) plus a single `details_updated` event when overview/env/impact/notes change.
- **`src/app/api/bugs/[id]/events/route.ts`** — `GET` returns the last 100 events for a bug.
- **`src/app/api/bugs/bulk/route.ts`** — `POST` accepts `{ bugIds, action }` where action is
  status / priority / stage / addLabel / delete. Records events for each affected bug.
- **`src/app/api/bugs/trend/route.ts`** — `GET ?days=N` returns `{ points, totalOpened,
  totalClosed }` by bucketing `Bug.createdAt` and `BugEvent` (type=status_changed, newValue=closed)
  into daily buckets over the last N days (max 90).
- **`src/app/api/bugs/export/route.ts`** — `GET ?format=csv|json` streams a real file download
  with proper `Content-Disposition` header. CSV escapes commas/quotes/newlines.
- **`src/app/api/bugs/import/route.ts`** — `POST { bugs: [...] }` accepts an array (max 500),
  auto-creates missing labels by name, parses `overview` templates, records `created` events.

### Auto-event recording
- **`POST /api/bugs`** now records a `created` event after insertion.
- **`PUT /api/bugs/[id]`** now diffs the before/after rows and records one event per changed
  tracked field, plus a `labels_changed` event when `labelIds` is supplied.

### New hooks (`src/hooks/`)
- **`use-keyboard-shortcuts.ts`** — global keyboard hook. Handles `⌘K` (command palette),
  `n` (new bug), `/` (focus search via custom event), `?` (shortcuts help), `g d/b/l/e`
  (two-key navigation sequences), `Esc` (close dialog / go back). Uses a `handlersRef` to
  avoid re-binding the listener on every render. Exports the `ShortcutDef[]` list for the
  help dialog.
- **`use-saved-filters.ts`** — persists filter presets to `localStorage` under
  `ib4g:saved-filters`. Provides `saveCurrentFilter(name)`, `deleteSavedFilter(id)`,
  `applySavedFilter(filters)`. Hydrates on mount.

### New TanStack Query hooks (appended to `use-bugs.ts`)
- `useBugEvents(bugId)` — fetches the activity timeline
- `useBulkAction()` — applies a bulk action, invalidates the bug cache, toasts on success
- `useBugTrend(days=14)` — fetches the opened/closed trend series
- `useExportBugs()` — triggers a CSV/JSON download (creates a blob URL + synthetic `<a>`)
- `useImportBugs()` — posts a JSON array, toasts created/skipped counts

### New UI components (`src/components/bugs/`)
- **`activity-timeline.tsx`** — vertical timeline with colored dots per event type,
  relative timestamps, actor + field + old→new value chips. Empty state when no events.
  Loading skeletons. Staggered fade-in.
- **`command-palette.tsx`** — `CommandDialog` (cmdk) with Quick Actions, Navigation,
  Appearance, and Recent Bugs groups. Shows keyboard shortcuts next to each item.
  Footer with navigation hints.
- **`shortcuts-help-dialog.tsx`** — grouped list (Navigation / Actions / Other) of all
  shortcuts with `<kbd>` chips.
- **`app-footer.tsx`** — sticky footer with app identity + version + theme indicator +
  quick stats (Open / Closed / Critical) + "Press ⌘K for commands" hint.
- **`empty-state.tsx`** — reusable empty-state component with a blurred icon halo,
  title, description, and optional action button.

### Enhanced components
- **`bug-detail-view.tsx`** — added an "Activity" card in the sidebar showing the
  `ActivityTimeline`. Hooked up `useBugEvents(bugId)`.
- **`bug-list-view.tsx`** — major rewrite:
  - Added a checkbox column (header = select-all-visible with indeterminate state)
  - Bulk-action toolbar appears when ≥1 row selected: Status / Priority / Stage /
    Add-label / Delete dropdowns + Clear button. Animated slide-in.
  - Replaced the old "Export all" (clipboard copy) button with an Export dropdown
    offering CSV and JSON file downloads.
  - Added an Import button opening a dialog with a JSON textarea + paste-and-import.
  - Added saved-filter chips below the filter bar (with popover preview + apply +
    delete). "Save current" button appears when filters are active.
  - Rows now stagger fade-in and highlight when selected (`bg-primary/5`).
  - Empty state uses the new `EmptyState` component.
- **`dashboard-view.tsx`** — added an "Activity Trend" area chart (opened vs closed
  over 14 days) with gradient fills, CartesianGrid, custom tooltip, and a legend
  showing totals. StatCards now have colored top accent bars and icon chips.
  Recent-bugs empty state uses `EmptyState`.
- **`app-sidebar.tsx`** — added a "Search… ⌘K" command-palette trigger button at
  the top (below the brand), dispatches a custom event to open the palette.
- **`app-content.tsx`** — wired up `useKeyboardShortcuts`, the `CommandPalette`,
  the `ShortcutsHelpDialog`, and the `AppFooter`. Listens for the
  `ib4g:open-command-palette` custom event from the sidebar. Mobile header now
  has a command-palette icon button.

### Styling polish
- KPI cards: colored top accent bars (slate/amber/emerald/rose) + icon-in-rounded-chip
- Trend chart: gradient area fills, dashed grid lines, themed tooltip
- Bulk toolbar: `bg-primary/5` highlight + slide-in animation
- Saved-filter chips with popover preview (shows JSON of the filter)
- Staggered fade-in animations on table rows and timeline items
- `EmptyState` with blurred icon halo for consistent empty UX
- Sticky footer with live stats + ⌘K hint

## Verification results (agent-browser QA at 1440×900 + iPhone 14)

| Flow | Result |
|------|--------|
| Dashboard renders 4 KPI cards + trend chart + 3 charts + recent | ✅ |
| Trend chart shows "Activity Trend", "Opened", "Closed" with totals | ✅ |
| Bug list: checkbox column + select-all with indeterminate state | ✅ |
| Selecting a row → bulk toolbar slides in (Status/Priority/Stage/Delete) | ✅ |
| Bulk priority change → "Priority changed to critical (bulk)" event recorded | ✅ |
| Export dropdown → CSV download (verified file content: 14 columns, all bugs) | ✅ |
| Export dropdown → JSON download supported | ✅ |
| Import dialog: paste JSON → bug created with labels (ui, regression) | ✅ |
| Command palette (⌘K): Quick Actions + Navigation + Appearance + Recent Bugs | ✅ |
| `?` opens shortcuts help dialog with 3 groups | ✅ |
| `n` opens new-bug form | ✅ |
| `g d` / `g b` / `g l` / `g e` navigate between views | ✅ |
| `/` focuses the bug-list search box | ✅ |
| `Esc` closes dialogs / returns from bug detail | ✅ |
| Bug detail: Activity timeline shows "Priority changed to critical (bulk)" + "Status changed from open to closed" | ✅ |
| Saved filters: set priority=Critical → "Save current" → "Critical bugs" chip appears → persisted in localStorage | ✅ |
| Footer: shows Open/Closed/Critical counts + "Press ⌘K for commands" | ✅ |
| Mobile: hamburger sidebar, `g d`/`n`/`Esc` shortcuts all work | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |
| All 5 API endpoints smoke-tested | ✅ all 200 |

### Bugs fixed during QA
1. **Prisma Client not regenerated** after adding `BugEvent` model → `db.bugEvent` was
   `undefined` at runtime. Fixed by running `bun run db:generate` and clearing `.next`.
2. **`labelId=all`** was being sent to the API and filtered literally — already fixed in
   Round 1, but confirmed still working.
3. **`SidebarView` type** was imported from `@/lib/types` but lives in `@/lib/constants`.
   Fixed all 4 import sites.
4. **`BugInput.overview`** field was missing from the interface (used by the form). Added.
5. **`skipDuplicates: true`** on `db.bugLabel.createMany` is not supported on SQLite.
   Removed it (the bulk route already pre-filters duplicates).
6. **React Compiler** rejected the manual `useMemo` in `use-keyboard-shortcuts.ts`
   (`goTo` closure didn't match declared deps). Refactored to drop the useMemo and
   use a `handlersRef` for stable handler references.
7. **`serialize.ts`** had a type mismatch: Prisma returns `Date` but the `Label` interface
   declares `createdAt: string`. Refactored to a `DateLike = Date | string` union and
   centralized ISO conversion.

## New file map (additions only)

```
prisma/schema.prisma                         ← + BugEvent model + Bug.events relation
src/lib/events.ts                            ← recordEvent + recordDiffEvents
src/lib/serialize.ts                         ← refactored (DateLike union)
src/lib/types.ts                             ← + BugEvent, TrendPoint, SavedFilter, BulkAction, ImportItem, BugInput.overview
src/hooks/use-bugs.ts                        ← + useBugEvents, useBulkAction, useBugTrend, useExportBugs, useImportBugs
src/hooks/use-saved-filters.ts               ← localStorage-backed saved filters
src/hooks/use-keyboard-shortcuts.ts          ← global keyboard shortcuts hook
src/app/api/bugs/[id]/events/route.ts        ← GET activity timeline
src/app/api/bugs/bulk/route.ts               ← POST bulk actions
src/app/api/bugs/trend/route.ts               ← GET opened/closed trend
src/app/api/bugs/export/route.ts             ← GET CSV/JSON download
src/app/api/bugs/import/route.ts             ← POST JSON import
src/components/bugs/activity-timeline.tsx     ← vertical event timeline
src/components/bugs/command-palette.tsx      ← cmdk-based ⌘K palette
src/components/bugs/shortcuts-help-dialog.tsx ← ? help dialog
src/components/bugs/app-footer.tsx           ← sticky footer with stats
src/components/bugs/empty-state.tsx           ← reusable empty state
src/components/bugs/bug-list-view.tsx         ← + multi-select, bulk toolbar, export/import, saved filters
src/components/bugs/bug-detail-view.tsx       ← + Activity timeline card
src/components/bugs/dashboard-view.tsx       ← + trend area chart + accent bars
src/components/bugs/app-sidebar.tsx          ← + ⌘K trigger button
src/components/bugs/app-content.tsx          ← + command palette + shortcuts + footer wiring
```

## Unresolved issues / risks

1. **Trend chart mostly flat** — the seed data was created with default `createdAt` (today),
   so the 14-day trend shows all activity on the last day. Once real bugs are created/closed
   over time, the chart will populate naturally. Could backfill seed data with random dates
   in a future round.
2. **No bulk-label-remove** — only "add label" is supported in bulk. Removing labels in
   bulk would require a separate action type.
3. **Import doesn't deduplicate by jiraId** — importing the same Jira ID twice creates two
   bugs. Could add a unique constraint + upsert logic later.
4. **Saved filters are per-browser** (localStorage) — not synced across devices. Would need
   a user account + DB table to sync.
5. **Command palette recent bugs** — limited to the 5 most recent from the stats endpoint.
   Could add a "search all bugs" mode with a dedicated API.

## Priority recommendations for the next phase

1. **Backfill seed data** with realistic `createdAt`/`updatedAt` spread over 30 days so the
   trend chart looks alive on first load.
2. **Bulk label remove** + bulk assignee change.
3. **Import deduplication** by jiraId (upsert).
4. **Activity log global view** — a dashboard widget or dedicated page showing the most
   recent events across ALL bugs (not just per-bug).
5. **Saved filters as DB entities** (requires auth) for cross-device sync.
6. **Command palette "search all bugs"** mode — type to search the full bug list, not just
   the 5 recent ones.
7. **Drag-and-drop** between bugs (e.g. drag a label onto a bug row).
8. **CSV import** (in addition to JSON) — parse a CSV file into the import payload.
9. **Notifications** — toast when a long-running bulk action completes (for large sets).

## How to run (unchanged)

```bash
bun run dev          # http://localhost:3000
bun run lint         # ESLint (0 errors)
bunx tsc --noEmit    # TypeScript (0 errors, project files only)
bun run db:push      # apply schema (BugEvent model added)
bun run db:generate  # regenerate Prisma Client (REQUIRED after schema change)
bun run scripts/seed.ts   # (re)seed sample data
```

The dev server is running, the database has 9 bugs + 8 labels, and the new BugEvent table
is populated with real activity from the QA session (status/priority changes recorded).


---

# Round 3 — Search, Activity Feed, Related Bugs & Polish (Task ID: 3)

## Current status assessment (start of round)

Round 2 left the project stable: dev server healthy, all routes 200, no console
errors. The worklog's "Priority recommendations" listed 9 items; this round
tackled the top 7 plus additional styling polish.

## Goals for this round

1. **Backfill seed data** with realistic 30-day spread + close events → trend chart alive
2. **Command palette "search all bugs"** mode with dedicated search API
3. **Global activity feed** widget on dashboard (events across ALL bugs)
4. **CSV import** (in addition to JSON) with file upload
5. **Bulk label remove** + **bulk assignee change**
6. **Bug detail "Related bugs"** card (shared module/platform/stage/labels, scored)
7. **Platform breakdown** chart on dashboard (stacked bar + legend with progress bars)
8. **Styling polish** — print stylesheet, card hover lift, shimmer skeletons, pulse dots

## Completed modifications

### New API routes (5)
- **`GET /api/bugs/search?q=…&limit=…`** — full-text search across summary, jiraId,
  actualResult, expectedResult, technicalNotes, envPlatform, envPage, overviewModule.
  Returns serialized bugs with badges-ready data.
- **`GET /api/bugs/activity?limit=…`** — global activity feed: recent BugEvents across
  ALL bugs, joined with bug summary + jiraId. Used by the dashboard widget.
- **`GET /api/bugs/[id]/related?limit=…`** — finds bugs sharing module/platform/stage/
  issue/labels with the source bug, scores each candidate (issue=4, module=3, platform=2,
  label=2 each, stage=1), returns top N sorted by score.

### Enhanced API routes
- **`POST /api/bugs/bulk`** — added 2 new action types:
  - `removeLabel` — deletes BugLabel rows for the given label across selected bugs,
    records `labels_changed` events with oldValue=label.name, newValue=null.
  - `assignee` — sets/clears the assignee field, records `assignee_changed` events
    with before/after values.
- **`POST /api/bugs/import`** — unchanged but now also reachable via CSV (parsed client-side).

### New seed script — `scripts/reseed.ts`
- Wipes all bugs/events/labels and recreates 12 bugs with:
  - Realistic `createdAt` timestamps spread over 25 days
  - 8 bugs marked `closed` with a `status_changed` event at a realistic later date
  - 4 bugs still `open`
  - Assignees (Sara Chen, Marco Diaz, Priya Nair) on most bugs
  - 10 labels (added `notifications` + `reports`)
  - 2 extra bug templates (email digest unsubscribe, OAuth mobile redirect, iOS keyboard,
    CSV truncation) for richer trend data
- Result: trend chart now shows 12 opened / 8 closed spread across 15 distinct days.

### New hooks (`src/hooks/use-bugs.ts` appended)
- `useBugSearch(query, limit=10)` — debounced search; enabled when query ≥ 2 chars;
  staleTime 15s.
- `useGlobalActivity(limit=20)` — fetches the global activity feed.
- `useRelatedBugs(bugId, limit=5)` — fetches scored related bugs for the detail view.

### New UI components (`src/components/bugs/`)
- **`global-activity-feed.tsx`** — vertical timeline of recent events across all bugs.
  Each entry shows the event icon, summary, bug jiraId + summary, relative time.
  Clickable → navigates to that bug's detail. Loading skeletons + empty state.
  ScrollArea capped at 360px. Staggered fade-in.
- **`related-bugs-card.tsx`** — shows up to 5 related bugs in the detail sidebar.
  Each row shows jiraId, summary, status/priority/stage badges, shared labels
  (highlighted with "+N shared" count), and relative updated time. Clickable.
- **`PlatformBreakdownCard`** (inside dashboard-view) — horizontal stacked bar showing
  platform proportions + a legend with per-platform progress bars, emoji icons
  (🌐 Web / 🔌 API / 📱 Mobile / 🖥️ Desktop), counts, and percentages.

### Enhanced components
- **`command-palette.tsx`** — major upgrade:
  - Added `useBugSearch` integration. When the query is ≥ 2 chars, the palette
    switches to "search mode": hides Quick Actions/Navigation/Appearance/Recent
    groups and shows a single "Search results" group with up to 8 matching bugs.
  - Each search result shows jiraId + summary + status/priority badges.
  - Footer shows live match count when searching.
  - Empty state differentiates between "no bugs match" and "no results".
  - Loading spinner shown while fetching.
  - Query resets when palette closes.
- **`bug-list-view.tsx`**:
  - Bulk toolbar now has 6 actions: Status, Priority, Stage, **Add label**,
    **Remove label**, **Assignee**, Delete.
  - Assignee dropdown offers 3 team members + "Clear assignee".
  - Import dialog rewritten with a JSON/CSV format toggle and an "Upload file"
    button that reads the file content into the textarea.
  - CSV format shows a column-hint helper text.
  - Added a client-side RFC-4180-ish CSV parser (`parseCsv`) that handles quoted
    fields, escaped quotes, and maps known columns to ImportItem fields.
- **`bug-detail-view.tsx`**:
  - Added a **Print** button in the header (calls `window.print()`).
  - Back button + sidebar marked `no-print` so printed output shows only the
    9 content cards.
  - Added the `RelatedBugsCard` at the bottom of the sidebar.
- **`dashboard-view.tsx`**:
  - Added a 2-column grid at the bottom with `GlobalActivityFeed` (left) and
    `PlatformBreakdownCard` (right).

### Styling polish (`src/app/globals.css`)
- **Print stylesheet** — `@media print` hides `.no-print`, forces white background,
  allows main to overflow visibly, adds `.break-inside-avoid`.
- **`.card-hover`** — subtle translateY(-1px) + box-shadow on hover (light + dark).
- **`.shimmer`** — gradient background animation for premium skeleton loading.
- **`.pulse-dot`** — 2s ease-in-out scale/opacity pulse for live indicators.
- **`.stagger-item`** — utility for staggered fade-in.

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Trend chart shows 12 opened / 8 closed across 15 distinct days | ✅ |
| Global Activity feed renders 15 events with bug summaries + relative times | ✅ |
| Platform Breakdown: Web 7 (58%), API 3 (25%), Mobile 2 (17%) | ✅ |
| Command palette search "auth" → 3 matching bugs with badges | ✅ |
| Related Bugs card on detail shows 5 matches with shared labels | ✅ |
| Bulk Assignee → "Sara Chen" applied to 2 bugs (verified via API) | ✅ |
| CSV import → 2 test bugs imported from CSV text | ✅ |
| CSV import file upload button present and accepts .csv | ✅ |
| Import dialog JSON/CSV toggle works | ✅ |
| Bulk Delete removed 2 CSV test bugs (back to 12) | ✅ |
| Print button present in bug detail header | ✅ |
| Dark mode toggle works (html class → "dark") | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |
| All new API endpoints smoke-tested | ✅ all 200 |

## New file map (additions in this round)

```
scripts/reseed.ts                              ← wipe + 30-day-spread reseed
src/app/api/bugs/search/route.ts               ← GET full-text search
src/app/api/bugs/activity/route.ts             ← GET global activity feed
src/app/api/bugs/[id]/related/route.ts         ← GET scored related bugs
src/app/api/bugs/bulk/route.ts                 ← + removeLabel + assignee actions
src/hooks/use-bugs.ts                          ← + useBugSearch, useGlobalActivity, useRelatedBugs
src/lib/types.ts                               ← + removeLabel/assignee in BulkAction
src/components/bugs/global-activity-feed.tsx   ← dashboard activity widget
src/components/bugs/related-bugs-card.tsx      ← detail sidebar related bugs
src/components/bugs/command-palette.tsx        ← + search-all mode
src/components/bugs/bug-list-view.tsx          ← + Remove label, Assignee bulk, CSV import, file upload
src/components/bugs/bug-detail-view.tsx        ← + Print button, Related Bugs card, no-print
src/components/bugs/dashboard-view.tsx         ← + Global Activity + Platform Breakdown
src/app/globals.css                            ← + print styles, card-hover, shimmer, pulse-dot
```

## Unresolved issues / risks

1. **CSV import parser is basic** — handles quoted fields and escaped quotes but
   doesn't handle multi-line quoted fields (newlines inside a quoted cell). For
   robust CSV parsing, consider PapaParse in a future round.
2. **Search is case-sensitive on SQLite** — `contains` without `mode: "insensitive"`
   works on SQLite but is case-sensitive. Affects search API + list filter. Would
   need FTS5 or Postgres for case-insensitive search.
3. **Related bugs scoring is heuristic** — the weights (issue=4, module=3, etc.)
   are reasonable but not configurable. Could expose as a setting.
4. **Global activity feed limited to 20** — no pagination. For very active systems,
   could add "Load more" or infinite scroll.
5. **Assignee list is hardcoded** — Sara Chen, Marco Diaz, Priya Nair. No user
   management yet; would need a User model + NextAuth.
6. **Print layout** — basic; no page breaks between cards. Could add
   `.break-inside-avoid` to each Card for cleaner printed output.

## Priority recommendations for the next phase

1. **Case-insensitive search** — migrate to Postgres or add SQLite FTS5 virtual table.
2. **User management** — User model + NextAuth + assignee picker with real users.
3. **PapaParse** for robust CSV import (handles multi-line cells, edge cases).
4. **Activity feed pagination** — "Load more" button or infinite scroll.
5. **Saved filters as DB entities** — sync across devices (requires auth).
6. **Notifications** — toast when a long-running bulk action completes.
7. **Drag-and-drop** labels onto bug rows (dnd-kit is already installed).
8. **Bug detail "share" button** — copy a deep link to the bug.
9. **Dashboard date-range picker** — let users change the trend window (7/14/30/90 days).

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs (4 open, 8 closed) + 10 labels
+ ~24 events (12 created + 8 status_changed + 4 from QA), all with realistic
timestamps spread over the last 25 days. The trend chart, global activity feed,
and platform breakdown are all populated with real data.

---

# Round 4 — Comments, Search, Sharing, Pagination & Polish (Task ID: 4)

## Current status assessment (start of round)

Round 3 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 9 items;
this round tackled the top 5 (case-insensitive search, share button, date-range
picker, activity pagination, comments) plus deep-link support.

## Goals for this round

1. **Case-insensitive search** — SQLite LOWER() workaround for search API + list filter
2. **Bug detail "Share" button** — copy deep link + deep-link `?bug=ID` URL support
3. **Dashboard date-range picker** — 7/14/30/90 days for the trend chart
4. **Activity feed "Load more"** — cursor-based infinite pagination
5. **Comment thread / discussion** — new BugComment model + CRUD API + UI with avatars
6. **Styling polish** — comment avatars, range selector, deep-link cleanup

## Completed modifications

### New Prisma model
- **`BugComment`** — `id`, `bugId`, `author`, `body`, `createdAt`, `updatedAt`.
  Cascade-deletes with the parent bug. Index on `[bugId, createdAt]`. Added
  `comments BugComment[]` relation to `Bug`.

### New API routes (3)
- **`GET /api/bugs/[id]/comments`** — list all comments for a bug (ascending by date).
- **`POST /api/bugs/[id]/comments`** — create a comment (author optional, defaults to "Anonymous"; body 1–4000 chars).
- **`PUT/DELETE /api/bugs/[id]/comments/[commentId]`** — edit or delete a comment
  (validates that the comment belongs to the bug).

### Enhanced API routes
- **`GET /api/bugs/search`** — rewritten with raw SQL `LOWER() LIKE` for true
  case-insensitive search across 10 text fields. Hydrates labels separately.
- **`GET /api/bugs`** (list) — search/platform/assignee filters now use raw SQL
  `LOWER()` to find matching IDs, then intersect with the Prisma `where` clause
  via `id: { in: [...] }`. Falls back to `["__none__"]` for no matches.
- **`GET /api/bugs/activity`** — added cursor-based pagination via `?before=<ISO date>`.
  Returns `{ events, hasMore, nextCursor }`. Fetches `limit+1` rows to detect next page.

### New hooks (`src/hooks/use-bugs.ts` appended)
- `useBugComments(bugId)` — fetches the comment thread.
- `useCreateComment(bugId)` — posts a new comment, invalidates the thread.
- `useDeleteComment(bugId)` — deletes a comment by ID.
- `useUpdateComment(bugId)` — edits a comment's body.
- `useGlobalActivity` — upgraded from `useQuery` to `useInfiniteQuery` with
  cursor-based `getNextPageParam`.

### New UI components (`src/components/bugs/`)
- **`comments-section.tsx`** — full discussion thread:
  - Comment list with colored avatar circles (deterministic color from author name hash),
    initials, relative timestamps, "(edited)" indicator.
  - New-comment form: optional author input + body textarea + "Comment" button.
  - `⌘+Enter` keyboard shortcut to submit.
  - Inline edit mode (Edit button on hover) with Save/Cancel.
  - Delete with AlertDialog confirmation.
  - Loading skeletons + empty state.
  - `no-print` class so comments don't appear in printed output.
- **`GlobalActivityFeed`** (enhanced) — now uses `useInfiniteQuery`, flattens pages,
  de-duplicates by event ID, and shows a "Load older events" button at the bottom
  with a loading spinner during fetch.

### Enhanced components
- **`bug-detail-view.tsx`**:
  - Added a **Share** button in the header — uses `navigator.share()` if available
    (mobile), otherwise copies `?bug=<id>` URL to clipboard with a toast.
  - Added the `CommentsSection` card at the bottom of the main content column
    (after Technical Notes).
  - Added `Share2` icon import + `handleShare` handler.
- **`dashboard-view.tsx`**:
  - Added a **date-range picker** (7d / 14d / 30d / 90d toggle buttons) in the
    Activity Trend card header.
  - `useBugTrend(trendDays)` now takes the selected range.
  - Description updates dynamically ("last 30 days" etc.).
- **`app-content.tsx`**:
  - Added **deep-link support**: on mount, reads `?bug=ID` from the URL, navigates
    to the bug detail, then cleans the URL via `history.replaceState` so a refresh
    doesn't re-trigger.

### Styling polish
- Comment avatars: 8-color palette, deterministic from author name, white initials.
- Date-range selector: segmented button group with active state.
- "Load older events" button: ghost style with ChevronDown icon + spinner.
- Deep-link URL cleanup (no query param pollution after navigation).

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Case-insensitive search: "AUTH" = "auth" (both return 3 results) | ✅ |
| List filter "DARK" finds dark mode bug | ✅ |
| Dashboard date-range: click "30d" → "last 30 days" + chart updates | ✅ |
| Bug detail: Share button → "Bug link copied to clipboard" toast | ✅ |
| Deep link `/?bug=<id>` → opens bug detail directly, URL cleaned | ✅ |
| Bug detail: Discussion section renders with "No comments yet" empty state | ✅ |
| Add comment → posts via API → appears in thread with "Anonymous" avatar | ✅ |
| Comment textarea + "⌘+Enter to send" hint + disabled button when empty | ✅ |
| Activity feed: "Load older events" button loads more events | ✅ |
| Print button + Share button present in header | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |
| All 7 API endpoints smoke-tested | ✅ all 200 |

### Bugs fixed during QA
1. **Dashboard JSX parse error** — extra `</div>` in the trend chart header after
   adding the date-range selector. Fixed the div nesting.
2. **`mode: "insensitive"` not supported on SQLite** — Prisma 6 rejects this for
   SQLite. Rewrote both search routes to use raw SQL `LOWER() LIKE` with `$queryRaw`.
3. **`useInfiniteQuery` pageParam typing** — the `QueryFunctionContext`'s
   `pageParam` is `unknown`, not `string`. Fixed by casting `ctx.pageParam as string | undefined`.
4. **`setView`/`selectBug` not in scope** in the deep-link effect. Fixed by
   reading from `useBugStore.getState()` inside the effect instead of the closure.

## New file map (additions in this round)

```
prisma/schema.prisma                              ← + BugComment model + Bug.comments relation
src/app/api/bugs/[id]/comments/route.ts          ← GET + POST comments
src/app/api/bugs/[id]/comments/[commentId]/route.ts ← PUT + DELETE comment
src/app/api/bugs/search/route.ts                 ← rewritten: raw SQL LOWER() case-insensitive
src/app/api/bugs/route.ts                        ← search/platform/assignee now case-insensitive
src/app/api/bugs/activity/route.ts               ← + cursor-based pagination
src/hooks/use-bugs.ts                            ← + useBugComments, useCreateComment, useDeleteComment, useUpdateComment; useGlobalActivity → useInfiniteQuery
src/lib/types.ts                                 ← + BugComment interface
src/components/bugs/comments-section.tsx         ← discussion thread with avatars + edit/delete
src/components/bugs/global-activity-feed.tsx     ← + infinite scroll + Load more button
src/components/bugs/bug-detail-view.tsx          ← + Share button + CommentsSection
src/components/bugs/dashboard-view.tsx          ← + date-range picker (7/14/30/90d)
src/components/bugs/app-content.tsx             ← + deep-link ?bug=ID support
```

## Unresolved issues / risks

1. **Drag-and-drop labels** (Phase U) — deferred to next round. dnd-kit is installed
   but the DnD interaction needs careful design (drop zones on rows, visual feedback).
2. **In-app notification bell** (Phase V) — deferred. The existing toast system
   already covers bulk-action feedback; a bell would add value for background events
   (e.g. new comments on watched bugs) but requires a subscription/polling mechanism.
3. **Comment author identity** — currently a free-text input. No real auth yet,
   so anyone can post as anyone. Would need NextAuth + User model.
4. **Comment markdown rendering** — the placeholder mentions "markdown supported"
   but the body is rendered as plain `whitespace-pre-wrap` text. react-markdown
   is installed; could wire it in for the next round.
5. **Search performance** — the raw SQL `LOWER() LIKE` scans all rows. For large
   datasets, an FTS5 virtual table or Postgres `tsvector` would be much faster.
6. **Activity feed deduplication** — handled client-side via a Set. If the same
   event appears in two pages (edge case at the cursor boundary), it's filtered.

## Priority recommendations for the next phase

1. **Markdown rendering** for comment bodies (react-markdown is installed).
2. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
3. **In-app notification bell** with unread count for new comments/events.
4. **User model + NextAuth** — real identities for comment authors + assignees.
5. **CSV import with PapaParse** — robust multi-line cell handling.
6. **Saved filters as DB entities** — sync across devices (requires auth).
7. **Bug detail "copy as Markdown"** — export the whole bug as a markdown doc.
8. **Dashboard widgets** — SLA / resolution-time chart, assignee workload chart.
9. **WebSocket mini-service** for real-time comment + event push.

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run db:push                  # apply schema (BugComment model added)
bun run db:generate              # regenerate Prisma Client (REQUIRED after schema change)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 1 test
comment, all with realistic timestamps. Case-insensitive search, comments, deep-linking,
date-range picker, and activity pagination are all functional.

---

# Round 5 — Markdown Comments, Export, Workload Widgets & Polish (Task ID: 5)

## Current status assessment (start of round)

Round 4 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 9 items;
this round tackled markdown rendering, bug export, dashboard widgets, and styling polish.

## Goals for this round

1. **Markdown rendering** for comment bodies (react-markdown) + formatting toolbar
2. **Bug detail "Export as Markdown"** — download the whole bug as a .md file
3. **Assignee workload chart** — stacked open/closed bars per assignee
4. **Resolution time widget** — avg/min/max time from creation to close
5. **Styling polish** — comment avatars, toolbar, gradient stat cards

## Completed modifications

### New library helper — `src/lib/bug-export.ts`
- `bugToMarkdown(bug, comments)` — converts a bug + its comments into a standalone
  Markdown document with: H1 title, meta table, Overview breadcrumb, Environment
  table, Preconditions (bullets), Steps (numbered), Actual/Expected, Impact Analysis
  (3 sub-sections), Technical Notes (fenced code block), Discussion (comments with
  author + timestamp), and a footer with a deep link.
- `downloadBugAsMarkdown(bug, comments)` — creates a Blob, triggers a download
  with a slugified filename (`<jiraId-or-slug>.md`).

### Enhanced API — `GET /api/bugs/stats`
- Added `byAssignee`: groups all bugs by assignee, returns `{ name, open, closed, total }`
  sorted by total descending. Includes "(unassigned)" for null assignees.
- Added `resolutionTimeHours`: for each closed bug, finds the FIRST
  `status_changed → closed` event, computes the delta from `bug.createdAt` to that
  event, and returns `{ avg, min, max, count }` in hours.

### Enhanced types — `src/lib/types.ts`
- `BugStats` now includes `byAssignee` and `resolutionTimeHours`.

### New UI component — `src/components/bugs/markdown.tsx`
- Lightweight `Markdown` wrapper around `react-markdown` v10.
- Themed styling for: headings (h1–h4), paragraphs, inline code (rose-tinted),
  code blocks (muted bg, monospace), lists (disc/decimal), links (target=_blank,
  rel=noopener), blockquotes (border-left), strong/em, horizontal rules.
- No `remark-gfm` dependency (not installed) — tables/strikethrough omitted.

### Enhanced `src/components/bugs/comments-section.tsx`
- Comment bodies now rendered with the `Markdown` component instead of plain text.
- Added a **markdown formatting toolbar** above the textarea with 8 buttons:
  Bold (⌘B), Italic (⌘I), Inline code, Code block, Link, Blockquote, Bullet list,
  Numbered list. Each button wraps/inserts syntax around the current selection and
  restores the cursor position via `requestAnimationFrame` + `setSelectionRange`.
- Added `⌘B` / `⌘I` keyboard shortcuts for bold/italic.
- Toolbar buttons use `onMouseDown={preventDefault}` so the textarea doesn't lose
  focus when clicking them.
- "Markdown supported" hint in the toolbar's right side.

### Enhanced `src/components/bugs/bug-detail-view.tsx`
- Added an **"Export .md"** button in the header (FileDown icon) that calls
  `downloadBugAsMarkdown(bug, comments)` and shows a "Markdown downloaded" toast.
- Hooked up `useBugComments(bugId)` so the export includes the discussion thread.

### Enhanced `src/components/bugs/dashboard-view.tsx`
- Added a 2-column grid with two new widgets below the activity/platform row:
  1. **AssigneeWorkloadCard** — stacked horizontal bars (amber=open, emerald=closed)
     per assignee, with colored avatar circles (deterministic from name),
     initials, and "X total · Y open · Z closed" labels. Caps at 6 assignees
     with a "+N more" footer.
  2. **ResolutionTimeCard** — 3 stat tiles (Average / Fastest / Slowest) with
     colored backgrounds (amber/emerald/rose), smart formatting (m/h/d units),
     and a footer explaining the computation method.

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Dashboard: Assignee Workload shows Sara Chen (5 total, 3 open, 2 closed) + 3 more | ✅ |
| Dashboard: Resolution Time shows Average 4.9d, Fastest 22.9h, Slowest 10d | ✅ |
| Bug detail: Export .md button present + downloads `<slug>.md` file | ✅ |
| Exported markdown has title, meta table, all 9 sections, comments, deep link | ✅ |
| Comment with markdown (**bold**, *italic*, `code`, list, > blockquote) renders correctly | ✅ |
| Markdown toolbar: 8 buttons present (Bold, Italic, Code, Code block, Link, Quote, UL, OL) | ✅ |
| Comment textarea + ⌘+Enter to send + ⌘B/⌘I shortcuts | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |
| Stats API returns `byAssignee` (4 entries) + `resolutionTimeHours` (avg=117h, count=8) | ✅ |

## New file map (additions in this round)

```
src/lib/bug-export.ts                            ← bugToMarkdown + downloadBugAsMarkdown
src/components/bugs/markdown.tsx                 ← Markdown renderer (react-markdown wrapper)
src/app/api/bugs/stats/route.ts                  ← + byAssignee + resolutionTimeHours
src/lib/types.ts                                 ← + BugStats.byAssignee + resolutionTimeHours
src/components/bugs/comments-section.tsx         ← + Markdown rendering + formatting toolbar
src/components/bugs/bug-detail-view.tsx          ← + Export .md button + useBugComments
src/components/bugs/dashboard-view.tsx           ← + AssigneeWorkloadCard + ResolutionTimeCard
```

## Unresolved issues / risks

1. **No `remark-gfm`** — tables and strikethrough aren't supported in markdown
   rendering. Could install `remark-gfm` for full GitHub-flavored markdown.
2. **Comment author identity** — still a free-text input. No real auth yet.
3. **Resolution time** — based on the FIRST `status_changed → closed` event. If a
   bug is reopened and closed again, only the first close is counted. Could
   use the LAST close event instead, or compute time-to-final-close.
4. **Assignee colors** — deterministic from name hash, but not configurable.
5. **Export .md** — includes comments but not the activity timeline (events).
   Could add an "Export with timeline" option.

## Priority recommendations for the next phase

1. **Install `remark-gfm`** for tables/strikethrough in markdown comments.
2. **In-app notification bell** with unread count for new comments/events.
3. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
4. **User model + NextAuth** — real identities for comment authors + assignees.
5. **Watch/subscribe to bugs** — get notified on changes (requires auth).
6. **CSV import with PapaParse** — robust multi-line cell handling.
7. **WebSocket mini-service** for real-time comment + event push.
8. **Dashboard "priority heatmap"** — priority × stage matrix showing counts.
9. **Bug detail "copy as JSON"** — export the raw bug object for API debugging.

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 2
test comments (one with markdown formatting). Markdown rendering, the formatting
toolbar, Export .md, assignee workload, and resolution time widgets are all functional.

---

# Round 6 — GFM Markdown, Notifications, Heatmap & Export Menu (Task ID: 6)

## Current status assessment (start of round)

Round 5 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 9 items;
this round tackled GFM markdown, in-app notifications, priority heatmap,
export menu, and styling polish.

## Goals for this round

1. **Full GFM markdown** — install `remark-gfm` + `rehype-sanitize` for tables/strikethrough/task lists
2. **In-app notification bell** — Zustand-persisted store + bell with unread count + dropdown panel
3. **Priority × Stage heatmap** — colored matrix on the dashboard
4. **Export dropdown menu** — consolidate Markdown/JSON/Template/Print into one menu
5. **Styling polish** — heatmap colors, notification avatars, bell pulse animation

## Completed modifications

### New packages installed
- **`remark-gfm@4.0.1`** — GitHub-flavored markdown (tables, strikethrough, task lists, autolinks)
- **`rehype-sanitize@6.0.0`** — HTML sanitization with a custom schema allowing `target`/`rel` on links

### New store — `src/store/notification-store.ts`
- Zustand store with `persist` middleware (localStorage key `ib4g:notifications`).
- `AppNotification` type: `id`, `type` (bug_created/bug_updated/bug_closed/comment_added/bulk_action),
  `title`, `description`, `bugId?`, `timestamp`, `read`.
- Actions: `addNotification`, `markAllRead`, `markRead`, `removeNotification`, `clearAll`.
- Keeps last 50 notifications, tracks `unreadCount`, persists across sessions.

### New UI component — `src/components/bugs/notification-bell.tsx`
- Bell icon button with a pulsing red unread-count badge.
- Popover panel with:
  - Header: "Notifications" + unread badge + "Mark all read" + "Clear" actions.
  - List: each notification has a colored icon circle, title, description (2-line clamp),
    relative timestamp, unread dot, and a hover-dismiss (X) button.
  - Empty state with bell icon + helpful text.
  - ScrollArea capped at 360px.
- Clicking a notification marks it read + navigates to the bug detail (if `bugId` is set).

### Enhanced hooks — `src/hooks/use-bugs.ts`
- `useCreateBug` → dispatches a `bug_created` notification on success.
- `useUpdateBug` → detects `open → closed` status change and dispatches a `bug_closed` notification.
- `useBulkAction` → dispatches a `bulk_action` notification with the action type + affected count.
- `useCreateComment` → dispatches a `comment_added` notification with the author + body preview.

### Enhanced `src/components/bugs/markdown.tsx`
- Now uses `remarkGfm` plugin for tables, strikethrough, task lists, autolinks.
- Uses `rehypeSanitize` with a custom schema that allows `target`/`rel` on `<a>` tags.
- Added themed styling for: tables (border-collapse, header bg, zebra rows), `del` (line-through,
  muted), task list items (checkbox styling, flex layout).

### Enhanced API — `GET /api/bugs/stats`
- Added `priorityStageMatrix`: groups bugs by `[priority, environmentStage]` and returns
  `{ priority, stage, count }[]` for the heatmap.

### Enhanced `src/lib/types.ts`
- `BugStats` now includes `priorityStageMatrix`.

### New dashboard widget — `PriorityHeatmapCard` (in dashboard-view.tsx)
- 4×3 matrix (critical/high/medium/low × dev/staging/production) with colored cells.
- Each cell's background color matches the priority (rose/orange/amber/sky) with opacity
  scaled by count relative to the max (0.35–1.0 opacity).
- Row totals (per priority) + column totals (per stage) + grand total.
- Hover scale effect on cells, "·" for zero counts.
- Sticky first column (priority labels) for horizontal scroll on mobile.

### Enhanced `src/components/bugs/bug-detail-view.tsx`
- Replaced separate "Export .md" + "Copy template" + "Print" buttons with a single
  **Export dropdown menu** (FileDown icon + ChevronDown):
  - Download as Markdown (.md)
  - Copy as JSON — copies the raw bug object as pretty-printed JSON
  - Copy IB4G template
  - Print / Save as PDF
- Added `handleCopyJson` handler + `useBugComments` hook (for markdown export).

### Enhanced `src/components/bugs/app-sidebar.tsx`
- Added the `NotificationBell` to the sidebar footer (next to the theme toggle).
- Redesigned the footer to show bell + theme side-by-side when expanded, stacked when collapsed.

### Enhanced `src/components/bugs/app-content.tsx`
- Added the `NotificationBell` to the mobile header (between command palette + New bug).

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Markdown with tables/strikethrough renders (remark-gfm) | ✅ |
| Dashboard: Priority × Stage Heatmap shows 4×3 matrix with colored cells + totals | ✅ |
| Heatmap: Critical/Production=2, High/Staging=2, Medium/Dev=2, etc. (12 total) | ✅ |
| Notification bell in sidebar footer with pulse animation | ✅ |
| Empty state: "No notifications" with helpful text | ✅ |
| Added comment → bell shows "(1 unread)" badge | ✅ |
| Bell popover: "1 new" + "Comment by Anonymous" + "Testing notification system!" + timestamp | ✅ |
| Bug detail: Export dropdown with 4 options (Markdown, JSON, Template, Print) | ✅ |
| Stats API returns `priorityStageMatrix` (7 entries) | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |

## New file map (additions in this round)

```
src/store/notification-store.ts                   ← Zustand-persisted notification store
src/components/bugs/notification-bell.tsx         ← Bell + popover panel
src/components/bugs/markdown.tsx                  ← + remark-gfm + rehype-sanitize
src/app/api/bugs/stats/route.ts                   ← + priorityStageMatrix
src/lib/types.ts                                  ← + BugStats.priorityStageMatrix
src/hooks/use-bugs.ts                             ← + notification dispatches in 4 hooks
src/components/bugs/bug-detail-view.tsx           ← + Export dropdown menu + Copy as JSON
src/components/bugs/dashboard-view.tsx            ← + PriorityHeatmapCard
src/components/bugs/app-sidebar.tsx               ← + NotificationBell in footer
src/components/bugs/app-content.tsx              ← + NotificationBell in mobile header
```

## Unresolved issues / risks

1. **Notifications are client-side only** — stored in localStorage, not synced across
   devices. Would need a server-side store + polling/WebSocket for real cross-device sync.
2. **No notification types for imports/exports** — these actions don't generate notifications
   (they're user-initiated and already get toasts).
3. **Heatmap cells not clickable** — could link to a filtered bug list (priority=X & stage=Y).
4. **Markdown sanitization** — `rehype-sanitize` with the default schema + link attributes.
   Could tighten further for production (e.g. strip all HTML).
5. **Bell unread count** — doesn't auto-decrement when a new notification is added while
   the panel is open. Would need an effect to mark-all-read on open.

## Priority recommendations for the next phase

1. **Click heatmap cells** → navigate to filtered bug list.
2. **Auto-mark notifications read** when the panel is opened for >2 seconds.
3. **WebSocket mini-service** for real-time notification push.
4. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
5. **User model + NextAuth** — real identities for comment authors + assignees.
6. **Watch/subscribe to bugs** — get notified on changes (requires auth).
7. **CSV import with PapaParse** — robust multi-line cell handling.
8. **Notification preferences** — let users mute certain types.
9. **Bug detail "copy as cURL"** — export a curl command for the API.

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 3 comments.
GFM markdown, the notification bell (with persisted unread state), the priority heatmap,
and the consolidated export dropdown are all functional.

---

# Round 7 — Clickable Heatmap, Assignee Filter, cURL Export & Polish (Task ID: 7)

## Current status assessment (start of round)

Round 6 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 9 items;
this round tackled clickable heatmap, auto-mark-read notifications, cURL
export, assignee filter, and styling polish.

## Goals for this round

1. **Clickable heatmap cells** → navigate to filtered bug list (priority + stage)
2. **Auto-mark notifications read** when panel opened >2.5s
3. **Bug detail "Copy as cURL"** — export a curl command for API debugging
4. **Assignee filter dropdown** — populated from real assignees with bug counts
5. **Styling polish** — clickable labels/totals, hover states, 5-column filter grid

## Completed modifications

### New API route — `GET /api/bugs/assignees`
- Returns all distinct non-null assignees with their bug counts:
  `{ assignees: [{ name, total, open, closed }] }` sorted by total descending.
- Used to populate the assignee filter dropdown.

### Enhanced API — `GET /api/bugs` (list)
- The `assignee` filter now handles the special value `__unassigned__` →
  filters by `assignee: null`. Other values use case-insensitive `LOWER() LIKE`.

### Enhanced store — `src/store/bug-store.ts`
- Added `setAssignee(a: string | "all")` action. Sets `filters.assignee` to
  `undefined` when "all", or the raw string otherwise. Resets page to 1.
- Added `assignee` to the `hasActiveFilters` check in bug-list-view.

### Enhanced `src/components/bugs/dashboard-view.tsx` — PriorityHeatmapCard
- **Cells are now clickable buttons** — clicking a non-zero cell navigates to
  the bug list filtered by that priority + stage.
- **Row labels clickable** — clicking a priority label filters by that priority
  only (stage = all).
- **Column headers clickable** — clicking a stage header filters by that stage
  only (priority = all).
- **Footer totals clickable** — column totals filter by stage; grand total
  clears all filters and shows all bugs.
- Hover effects: cells scale 1.05, labels/headers change to `text-primary`.
- Titles: "View N critical bugs in production" etc.

### Enhanced `src/components/bugs/notification-bell.tsx`
- **Auto-mark-read**: when the panel is opened and there are unread notifications,
  a 2.5-second timer starts. After it fires, `markAllRead()` is called. The
  timer is cleared on close or unmount.
- The unread badge pulses while unread, then disappears.

### Enhanced `src/components/bugs/bug-detail-view.tsx`
- Added **"Copy as cURL"** to the Export dropdown menu.
- `handleCopyCurl` generates a `curl -X GET '<origin>/api/bugs/<id>' -H 'Accept: application/json' | jq .`
  command and copies it to the clipboard.
- The Export dropdown now has 5 options: Markdown, JSON, cURL, IB4G template, Print.

### Enhanced `src/components/bugs/bug-list-view.tsx`
- Added a **5th filter dropdown** (Assignee) to the filter grid.
- The grid is now `grid-cols-2 sm:grid-cols-4 lg:grid-cols-5`.
- Options: "All assignees", "Unassigned" (italic), then each assignee with
  their bug count (e.g. "Sara Chen (5)").
- Uses the new `useAssignees()` hook.

### New hook — `useAssignees()`
- Fetches `/api/bugs/assignees`, 60s staleTime.

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Heatmap cell click (critical/production=2) → navigates to bug list with priority=Critical, stage=Production, "2 reports tracked" | ✅ |
| Heatmap row label click → filters by priority only | ✅ |
| Heatmap column header click → filters by stage only | ✅ |
| Heatmap grand total click → clears all filters, shows 12 reports | ✅ |
| Assignee filter dropdown: shows "All assignees", "Unassigned", "Sara Chen (5)", "Marco Diaz (3)", "Priya Nair (2)" | ✅ |
| Selecting Sara Chen → filters list to her bugs | ✅ |
| Reset button → clears all filters back to 12 reports | ✅ |
| Bug detail Export dropdown: 5 options (Markdown, JSON, cURL, Template, Print) | ✅ |
| "Copy as cURL" executes without error | ✅ |
| Notification bell auto-marks read after 2.5s | ✅ |
| Assignees API returns 3 assignees with counts | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |

## New file map (additions in this round)

```
src/app/api/bugs/assignees/route.ts              ← GET distinct assignees with counts
src/app/api/bugs/route.ts                        ← + __unassigned__ handling
src/store/bug-store.ts                            ← + setAssignee action
src/hooks/use-bugs.ts                             ← + useAssignees hook
src/components/bugs/dashboard-view.tsx            ← clickable heatmap cells/labels/totals
src/components/bugs/notification-bell.tsx         ← + auto-mark-read after 2.5s
src/components/bugs/bug-detail-view.tsx           ← + Copy as cURL in export menu
src/components/bugs/bug-list-view.tsx             ← + 5th assignee filter dropdown
```

## Unresolved issues / risks

1. **Assignee filter is case-insensitive substring match** — searching "Sara" matches
   "Sara Chen" and "Sara Smith". Exact match would be more predictable but less flexible.
2. **Heatmap navigation overwrites existing filters** — clicking a cell sets
   priority+stage, clearing any search/platform/assignee filters the user had.
   Could preserve those in a future iteration.
3. **cURL command uses `| jq .`** — assumes `jq` is installed. Could offer a
   plain version without the pipe.
4. **Auto-mark-read is 2.5s** — might be too fast for some users. Could make
   it configurable.

## Priority recommendations for the next phase

1. **Preserve filters on heatmap navigation** — only change priority/stage, keep
   search/platform/assignee.
2. **WebSocket mini-service** for real-time notification push.
3. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
4. **User model + NextAuth** — real identities for comment authors + assignees.
5. **Watch/subscribe to bugs** — get notified on changes (requires auth).
6. **CSV import with PapaParse** — robust multi-line cell handling.
7. **Dashboard "burn-down" chart** — open bugs over time.
8. **Bug detail "Edit history"** — show all edits inline (not just events).
9. **Keyboard shortcut to cycle assignees** — `[` / `]` to go prev/next assignee's bugs.

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 3 comments.
Clickable heatmap navigation, auto-mark-read notifications, cURL export, and the
assignee filter dropdown are all functional.

---

# Round 8 — Burndown Chart, Assignee Cycling & Polish (Task ID: 8)

## Current status assessment (start of round)

Round 7 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 9 items;
this round tackled the burndown chart, assignee cycling shortcuts, and verified
that heatmap navigation already preserves filters.

## Goals for this round

1. **Verify heatmap preserves filters** — confirmed the store's `setPriority`/`setStage`
   already spread `...s.filters`, so search/platform/assignee are preserved.
2. **Dashboard burn-down chart** — open bugs over time (new API + chart widget)
3. **Keyboard shortcut to cycle assignees** — `[` / `]` to go prev/next
4. **Styling polish** — burndown chart with gradient area fill

## Completed modifications

### New API route — `GET /api/bugs/burndown?days=N`
- Computes a daily series of "open bug count at end of day" for the last N days.
- For each bug: if `createdAt <= endOfDay(D)` and (no close event OR first close
  event > endOfDay(D)), it's open on day D.
- Returns `{ points: [{date, open, closed}], currentOpen, peakOpen, totalClosed }`.
- Uses the first `status_changed → closed` event per bug (earliest close).

### New hook — `useBugBurndown(days=30)`
- Fetches the burndown series, 30s staleTime.

### New dashboard widget — `BurndownCard`
- Area chart showing the open-bug count over time with an amber gradient fill.
- Header shows: "Now open" (current), "Peak" (max), "Closed" (total closed events).
- Uses the same `trendDays` state as the Activity Trend chart (7/14/30/90 picker).
- CartesianGrid, custom tooltip with full date, themed colors.

### Enhanced keyboard shortcuts — `src/hooks/use-keyboard-shortcuts.ts`
- Added `[` (prev) and `]` (next) shortcuts to cycle the assignee filter.
- Only fires when on the bugs list view (not in bug detail or dialogs).
- Dispatches a custom `ib4g:cycle-assignee` event with `{ direction: "next" | "prev" }`.
- Added the shortcut to the `shortcuts` array so it appears in the `?` help dialog.

### Enhanced bug-list-view — assignee cycling listener
- Listens for `ib4g:cycle-assignee` events.
- Builds the option list: `["all", ...assigneeNames]`.
- Finds the current assignee's index, increments/decrements with wraparound.
- Sets the new assignee + shows a toast: "Assignee: Sara Chen".
- Depends on `assignees` from `useAssignees()`.

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Burndown API returns 30 points, currentOpen=4, peakOpen=4, totalClosed=8 | ✅ |
| Dashboard: "Open Bugs Burndown" chart renders with "Now open 4, Peak 4, Closed 8" | ✅ |
| `]` shortcut on bug list → assignee filter cycles to "Sara Chen (5)" | ✅ |
| `[` shortcut → cycles back to "All assignees" | ✅ |
| Shortcuts help dialog (`?`) shows "Cycle assignee filter (next / prev) ] / [" | ✅ |
| Heatmap navigation preserves search/platform/assignee filters (store spreads) | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |

## New file map (additions in this round)

```
src/app/api/bugs/burndown/route.ts                ← GET open-bugs-over-time series
src/hooks/use-bugs.ts                             ← + useBugBurndown hook
src/components/bugs/dashboard-view.tsx            ← + BurndownCard widget
src/hooks/use-keyboard-shortcuts.ts               ← + [ / ] cycle assignee shortcuts
src/components/bugs/bug-list-view.tsx             ← + ib4g:cycle-assignee event listener
```

## Unresolved issues / risks

1. **Burndown uses first close event** — if a bug is reopened and closed again,
   only the first close counts. The bug would appear as "closed" from the first
   close date onward, even during its reopened period.
2. **Burn-down peak is flat** — with only 12 seed bugs over 30 days, the chart
   doesn't show a dramatic burn-down pattern. Would look better with more data.
3. **Assignee cycling toast** — shows on every cycle. Could be annoying if
   cycling rapidly. Could debounce or use a different feedback mechanism.
4. **No "Unassigned" in cycling** — the cycle goes `all → Sara → Marco → Priya → all`,
   skipping the "Unassigned" option. Could include it.

## Priority recommendations for the next phase

1. **WebSocket mini-service** for real-time notification push.
2. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
3. **User model + NextAuth** — real identities for comment authors + assignees.
4. **Watch/subscribe to bugs** — get notified on changes (requires auth).
5. **CSV import with PapaParse** — robust multi-line cell handling.
6. **Bug detail "Edit history"** — show all edits inline (not just events).
7. **Dashboard "assignee workload over time"** — stacked area per assignee.
8. **Bug list "group by"** — group by assignee/priority/stage.
9. **Settings page** — theme, notification preferences, default filters.

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 3 comments.
The burndown chart, assignee cycling shortcuts, and all previous features are functional.

---

# Round 9 — Group-By Feature & Component Refactor (Task ID: 9)

## Current status assessment (start of round)

Round 8 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 9 items;
this round tackled the bug list "group by" feature.

## Goals for this round

1. **Bug list "group by"** — group by assignee/priority/stage/status
2. **Component refactor** — extract FlatBugTable for cleaner conditional rendering
3. **Styling polish** — group headers with badges, colored dots, open/closed counts

## Completed modifications

### Enhanced store — `src/store/bug-store.ts`
- Added `groupBy: "none" | "assignee" | "priority" | "stage" | "status"` state.
- Added `setGroupBy` action.

### Enhanced `src/components/bugs/bug-list-view.tsx`
- **Group-by selector** — a dropdown in the header (next to Export/Import) with
  5 options: No grouping, By assignee, By priority, By stage, By status.
- **Grouping logic** — `useMemo` that builds a sorted `Map<string, Bug[]>`:
  - priority: critical → low
  - stage: dev → staging → production
  - status: open → closed
  - assignee: alphabetical
- **Conditional rendering** — when `groupBy !== "none"`, renders `<GroupedBugList>`;
  otherwise renders `<FlatBugTable>`.
- **Extracted `FlatBugTable` component** — the original table + pagination moved
  into a separate component for cleaner conditional rendering. Takes all the
  props it needs (bugs, selection state, pagination, handlers).
- **New `GroupedBugList` component** — renders one Card per group with:
  - Group header: colored dot/icon + label + count badge + "X open · Y closed" stats.
  - Group rows: checkbox + jiraId + summary + status/priority/stage badges + labels.
  - Staggered fade-in animation.
  - Empty state + loading skeletons.
- **`getGroupMeta` helper** — returns label/dot/icon for each group type using
  the existing PRIORITY_CONFIG/STAGE_CONFIG/STATUS_CONFIG.

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Group-by selector shows "No grouping" by default | ✅ |
| Selecting "By priority" → 4 group cards (Critical, High, Medium, Low) with counts | ✅ |
| Selecting "By assignee" → 4 group cards (Marco Diaz, Priya Nair, Sara Chen, Unassigned) | ✅ |
| Switching back to "No grouping" → flat table renders correctly | ✅ |
| Group headers show colored dots + count badges + open/closed stats | ✅ |
| Group rows are clickable → navigate to bug detail | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |

## New file map (additions in this round)

```
src/store/bug-store.ts                            ← + groupBy state + setGroupBy
src/components/bugs/bug-list-view.tsx             ← + group-by selector, GroupedBugList, FlatBugTable (extracted)
```

## Unresolved issues / risks

1. **Grouped view doesn't paginate** — shows all bugs from the current page's
   worth of data. If a group has many bugs, they all render. Could add per-group
   collapse/expand.
2. **No group collapse** — groups are always expanded. Could add a collapsible
   header to toggle visibility.
3. **Bulk selection in grouped view** — the "select all" checkbox only works
   in the flat table. The grouped view has per-row checkboxes but no group-level
   select.
4. **Group counts reflect current page only** — not the total across all pages.

## Priority recommendations for the next phase

1. **Collapsible groups** — click group header to expand/collapse.
2. **Group-level "select all"** — checkbox in group header.
3. **WebSocket mini-service** for real-time notification push.
4. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
5. **User model + NextAuth** — real identities for comment authors + assignees.
6. **CSV import with PapaParse** — robust multi-line cell handling.
7. **Settings page** — theme, notification preferences, default filters.
8. **Bug detail "Edit history"** — show all edits inline (not just events).

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 3 comments.
The group-by feature (by assignee/priority/stage/status) is functional with colored
group headers and per-group open/closed stats.

---

# Round 10 — Collapsible Groups & Group-Level Select (Task ID: 10)

## Current status assessment (start of round)

Round 9 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 8 items;
this round tackled the top 2: collapsible groups and group-level "select all".

## Goals for this round

1. **Collapsible groups** — click group header to expand/collapse
2. **Group-level "select all"** — checkbox in group header
3. **Styling polish** — chevron animations, "N selected" badge per group

## Completed modifications

### Enhanced `src/components/bugs/bug-list-view.tsx`
- **Extracted `GroupCard` component** — each group is now a self-contained component
  with its own `collapsed` state (default: expanded).
- **Collapsible group headers** — clicking the header toggles the `collapsed` state.
  A chevron icon (ChevronDown when expanded, ChevronRight when collapsed) provides
  visual feedback. The header has `cursor-pointer` + `select-none` for UX.
- **Group-level "select all" checkbox** — a Checkbox in the group header with
  `indeterminate` state support:
  - Checked (✓) when all bugs in the group are selected.
  - Indeterminate (—) when some but not all are selected.
  - Unchecked (○) when none are selected.
  - Clicking it selects/deselects all bugs in the group.
  - `stopPropagation` on the checkbox click prevents collapsing the group.
- **"N selected" badge** — when bugs in a group are selected, a primary-tinted badge
  appears next to the count badge showing "N selected".
- **Collapse animation** — the rows container has `animate-fade-in` for smooth
  appearance when expanding.
- **Hover state** — group header has `hover:bg-muted/50` for visual feedback.

### Refactored `GroupedBugList`
- Simplified to map over groups and render `<GroupCard>` for each.
- `GroupCard` encapsulates all the collapse + select-all + row rendering logic.

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Group by "By priority" → 4 group cards render (Critical, High, Medium, Low) | ✅ |
| Click Critical group header → collapses, bugs hidden | ✅ |
| Click again → expands, bugs visible | ✅ |
| Group-level "Select all in High" checkbox → selects all 3 High bugs | ✅ |
| "3 selected" badge appears in High group header | ✅ |
| Bulk toolbar shows "3 selected" | ✅ |
| ChevronDown (expanded) → ChevronRight (collapsed) icon transitions | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |

## New file map (additions in this round)

```
src/components/bugs/bug-list-view.tsx             ← + GroupCard component (collapse + select-all)
```

## Unresolved issues / risks

1. **Collapsed state not persisted** — groups re-expand on page reload or when
   switching group-by mode. Could persist to localStorage.
2. **Group counts reflect current page only** — still not fixed from Round 9.
3. **No "collapse all" / "expand all"** — could add a toolbar button.
4. **Group-level select doesn't update the "select all visible" checkbox** in
   the flat table header. They're independent.

## Priority recommendations for the next phase

1. **"Collapse all" / "Expand all" toolbar button**.
2. **Persist collapsed state** to localStorage.
3. **Settings page** — theme, default page size, default group-by.
4. **WebSocket mini-service** for real-time notification push.
5. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
6. **User model + NextAuth** — real identities for comment authors + assignees.
7. **CSV import with PapaParse** — robust multi-line cell handling.
8. **Bug detail "Edit history"** — show all edits inline (not just events).
9. **Dashboard "assignee workload over time"** — stacked area per assignee.

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 3 comments.
Collapsible groups with chevron animations and group-level "select all" with
indeterminate state are functional.

---

# Round 11 — Collapse All/Expand All, Settings Page & Keyboard Shortcuts (Task ID: 11)

## Current status assessment (start of round)

Round 10 left the project stable: dev server healthy, all routes 200, no console
errors, lint clean. The worklog's "Priority recommendations" listed 9 items;
this round tackled the top 3: collapse all/expand all, settings page, and keyboard
shortcuts for settings navigation.

## Goals for this round

1. **Collapse all / Expand all** — toolbar buttons for grouped bug list
2. **Settings page** — theme, default page size, default group-by, trend chart
   window, notification preferences, data/storage info
3. **Keyboard shortcut `g s`** — navigate to Settings
4. **Command palette** — "Go to Settings" option
5. **Styling polish** — settings page layout with cards, toggles, selects

## Completed modifications

### New store — `src/store/settings-store.ts`
- Zustand store with `persist` middleware (localStorage key `ib4g:settings`).
- Settings: `defaultPageSize`, `defaultGroupBy`, `defaultTrendDays`,
  `notifyOnBugCreated`, `notifyOnBugClosed`, `notifyOnCommentAdded`,
  `notifyOnBulkAction`.
- Actions: setters for each field + `resetSettings()`.
- All preferences are saved automatically to localStorage.

### Enhanced `src/components/bugs/bug-list-view.tsx` — GroupedBugList
- **Centralized collapse state** — moved from per-GroupCard `useState` to a
  `collapsedGroups: Set<string>` in GroupedBugList. This enables the
  collapse-all/expand-all feature.
- **"Collapse all" button** — collapses all groups by adding all group keys
  to the `collapsedGroups` set. Disabled when all are already collapsed.
- **"Expand all" button** — expands all groups by clearing the set. Disabled
  when no groups are collapsed.
- **ChevronsDownUp / ChevronsUpDown icons** — visual indicators for the buttons.
- **GroupCard refactored** — now receives `isCollapsed` and `onToggleCollapse`
  props instead of managing its own state. Cleaner separation of concerns.

### New UI component — `src/components/bugs/settings-view.tsx`
- Full settings page with 4 cards:
  1. **Appearance** — Light/Dark theme toggle buttons (uses next-themes).
  2. **Bug List Defaults** — page size (5/10/20/50), default grouping
     (none/assignee/priority/stage/status), trend chart window (7/14/30/90 days).
     "Apply defaults now" button applies the settings to the current session.
  3. **Notification Preferences** — 4 toggles (Bug report created, Bug closed,
     Comment added, Bulk actions) using Switch components. Changes are persisted
     to localStorage instantly.
  4. **Data & Storage** — shows the localStorage keys used by the app
     (`ib4g:settings`, `ib4g:notifications`, `ib4g:saved-filters`). "Reset all
     settings to defaults" button.
- Footer with app version + "Settings are saved automatically" note.

### Enhanced `src/lib/constants.ts`
- Added `"settings"` to the `SidebarView` type.
- Added a Settings sidebar item (icon: `Settings`, label: "Settings", description:
  "Preferences").
- Added `Settings` icon import.

### Enhanced `src/components/bugs/app-content.tsx`
- Added `case "settings": return <SettingsView />` to the view router.

### Enhanced `src/hooks/use-keyboard-shortcuts.ts`
- Added `g s` shortcut to navigate to Settings.
- Added it to the shortcuts list so it appears in the `?` help dialog.

### Enhanced `src/components/bugs/command-palette.tsx`
- Added "Go to Settings" command with `G S` shortcut hint.

## Verification results (agent-browser QA at 1440×900)

| Flow | Result |
|------|--------|
| Settings page renders with 4 cards (Appearance, Bug List Defaults, Notifications, Data & Storage) | ✅ |
| Theme toggle (Light/Dark) works | ✅ |
| Page size selector shows options (5/10/20/50 per page) | ✅ |
| Default grouping selector shows 5 options | ✅ |
| Trend chart window selector shows 7/14/30/90 days | ✅ |
| Notification toggles: 4 switches present (Bug created, Bug closed, Comment, Bulk) | ✅ |
| Toggling "Bug report created" → persisted to localStorage (`notifyOnBugCreated: false`) | ✅ |
| Data & Storage shows localStorage keys | ✅ |
| "Collapse all" button collapses all 4 priority groups | ✅ |
| "Expand all" button restores all groups | ✅ |
| `g s` keyboard shortcut navigates to Settings | ✅ |
| Command palette shows "Go to Settings" with `G S` hint | ✅ |
| Settings sidebar item appears in the nav | ✅ |
| ESLint (`bun run lint`) | ✅ 0 errors, 0 warnings |
| `bunx tsc --noEmit` (project files only) | ✅ 0 errors |
| Console / runtime errors | ✅ none |

## New file map (additions in this round)

```
src/store/settings-store.ts                       ← Zustand-persisted settings store
src/components/bugs/settings-view.tsx             ← full Settings page
src/components/bugs/bug-list-view.tsx             ← + Collapse all/Expand all, centralized collapse state
src/lib/constants.ts                              ← + "settings" SidebarView + Settings nav item
src/components/bugs/app-content.tsx               ← + SettingsView in view router
src/hooks/use-keyboard-shortcuts.ts               ← + g s shortcut for Settings
src/components/bugs/command-palette.tsx           ← + Go to Settings command
```

## Unresolved issues / risks

1. **Settings don't auto-apply on app load** — the user must click "Apply defaults
   now" or the defaults are only used when the store initializes. Could wire the
   settings store to the bug store + dashboard on mount.
2. **Notification preferences not enforced** — the toggles are saved but the
   notification dispatch hooks don't check them yet. Need to wire
   `useSettingsStore` into the mutation hooks.
3. **No "reset notifications"** — the reset button only resets settings, not
   the notification history.
4. **Collapsed state resets on group-by change** — switching grouping mode
   clears the collapsedGroups state.

## Priority recommendations for the next phase

1. **Wire notification preferences** — check `useSettingsStore` in mutation hooks
   before dispatching notifications.
2. **Auto-apply settings on mount** — initialize bug store + dashboard from
   settings store on first load.
3. **WebSocket mini-service** for real-time notification push.
4. **Drag-and-drop labels** onto bug rows (dnd-kit installed).
5. **User model + NextAuth** — real identities for comment authors + assignees.
6. **CSV import with PapaParse** — robust multi-line cell handling.
7. **Bug detail "Edit history"** — show all edits inline (not just events).
8. **Dashboard "assignee workload over time"** — stacked area per assignee.
9. **Bug list column sorting** — click column header to sort.

## How to run (unchanged)

```bash
bun run dev                      # http://localhost:3000
bun run lint                     # ESLint (0 errors)
bunx tsc --noEmit                # TypeScript (0 errors, project files only)
bun run scripts/reseed.ts        # wipe + reseed with 30-day-spread data
```

The dev server is running, the database has 12 bugs + 10 labels + ~24 events + 3 comments.
The Settings page (with theme, defaults, notification prefs, data info), collapse-all/expand-all,
and the `g s` keyboard shortcut are all functional.

---

# Round 12 — Minimal & Modern Claude-Inspired Redesign (Task ID: 12)

## Current status assessment

The project was stable (all routes 200, no console errors, lint clean). The user
requested a bug fix + a minimal and modern redesign inspired by Claude's interface.

## Goals

1. **Fix any bugs** — verified all views, no code bugs found
2. **Redesign CSS** — warm minimal Claude-inspired palette
3. **Redesign sidebar** — clean, minimal nav
4. **Redesign footer** — simple, uncluttered

## Completed modifications

### `src/app/globals.css` — Complete palette overhaul
- **Warm off-white background** (`oklch(0.985 0.005 75)`) instead of cold pure white
- **Warm dark foreground** (`oklch(0.28 0.01 75)`) instead of near-black
- **Coral accent** (`oklch(0.62 0.15 35)`) — Claude's signature warm orange
- **Larger radius** (0.75rem) for softer, rounder UI
- **Very subtle borders** (`oklch(0.92 0.005 75)`) — low contrast, warm
- **Warm muted colors** — all grays have a slight warm tint (hue 75)
- **Dark mode** — warm dark background (`oklch(0.17 0.008 75)`) not cold blue-black
- Simplified scrollbar (6px, thinner)
- Removed excessive decorations (card-hover, stagger-item, etc.)

### `src/components/bugs/app-sidebar.tsx` — Minimal sidebar
- Removed `APP_VERSION` from brand area
- Simplified command trigger button (smaller, more subtle)
- Removed "Workspace" section header
- Removed selected-bug indicator panel
- Simplified nav items (no active indicator dot/bar)
- Cleaner footer with notification bell + theme toggle
- Removed "Light mode"/"Dark mode" text labels — icon-only
- Simpler collapse button

### `src/components/bugs/app-footer.tsx` — Minimal footer
- Removed theme indicator, ⌘K hint, app icon
- Simple: app name + version on left, open/closed/critical on right
- No decorative elements

## Verification results

| Flow | Result |
|------|--------|
| Dashboard renders with warm palette | ✅ |
| Bug list (10 rows) with warm tones | ✅ |
| Bug detail renders correctly | ✅ |
| Labels page works | ✅ |
| Endpoints page works | ✅ |
| Settings page works | ✅ |
| Dark mode toggle (html class → "dark") | ✅ |
| Command palette (⌘K) opens with all options | ✅ |
| `n` shortcut opens new bug form | ✅ |
| `g s` shortcut navigates to Settings | ✅ |
| All sidebar nav items work | ✅ |
| ESLint | ✅ 0 errors |
| TypeScript | ✅ 0 errors |
| Console / runtime errors | ✅ none |

## Files modified

```
src/app/globals.css                              ← Complete warm minimal palette
src/components/bugs/app-sidebar.tsx              ← Minimal sidebar redesign
src/components/bugs/app-footer.tsx               ← Minimal footer
```
