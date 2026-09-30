# opt-out-log: blueprint

> Idea: yangxdev/greenlight#1 · One-line pitch: a checklist of the privacy and AI switches that vendors hide or quietly re-enable, with the path to each one and a reminder to re-check, for privacy-minded developers and power users.

## Scope

- One screen, `/`, with the headline "Privacy and AI switches worth checking again" and a hand-curated list of about 15 settings (the count is derived from the data, never hard-coded).
- Each item shows the vendor, what to turn off, the path to the switch, why it matters in one line, and the date a person last verified the path, or "Not verified yet" when nobody has.
- Ticking an item stores "last checked" in `localStorage`. A ticked item not re-checked within 30 days is flagged with the accent colour as "Re-check due". An unticked item is neutral.
- Filter by platform: All, OpenAI, Apple, Microsoft, Google, Browser, Other, each with its entry count.
- "Copy my checklist" copies a Markdown summary of the full list (ignoring the filter) to the clipboard. This is the one primary button.
- No accounts, no server storage, no sync. The list is a static JSON file in the repo, and contributions come by pull request.

## Data model

- **Storage:** browser `localStorage`, key `opt-out-log:checks:v1`, holding `Record<string, string>` (item id → ISO 8601 timestamp of last check). Theme is stored by the template's own key.
- The catalogue is static: `src/data/settings.json`, imported at build time. No MongoDB, no R2.
- Size: about 15 items, well under 5 KB of `localStorage`. Unknown ids in storage are dropped on load. Invalid JSON in storage is treated as empty.
- Stale rule: `now - checkedAt > 30 days` (30 × 24 h), so exactly 30 days is not stale. `now` is always passed in so tests are deterministic.
- `verifiedOn` is `null` for every entry the Factory writes, because it cannot check a live vendor UI. Only a person sets a date.

```ts
export type Platform = 'openai' | 'apple' | 'microsoft' | 'google' | 'browser' | 'other'

export interface SettingEntry {
  id: string // kebab-case, unique, stable
  platform: Platform
  product: string // "ChatGPT"
  title: string // "Stop using my chats to train models"
  path: string // "Settings > Data controls > Improve the model for everyone"
  why: string // one plain sentence
  verifiedOn: string | null // YYYY-MM-DD when a person confirmed the path, null if not yet
  url?: string // official page, https only
}

export type Checks = Record<string, string> // id -> ISO 8601 last-checked timestamp

export type Filter = Platform | 'all'

export type Status = 'unchecked' | 'checked' | 'stale'
```

## Routes

| Kind | Path              | Purpose                               | Request | Response         |
| ---- | ----------------- | ------------------------------------- | ------- | ---------------- |
| page | `/`               | the checklist, filter and copy button | –       | –                |
| api  | `GET /api/health` | smoke test (keep)                     | –       | `HealthResponse` |

No router dependency: there is one screen.

## Tasks

Ordered, each finishable in under about an hour by the Factory, each ending with `npm run check` green.

### Task 1: Types, catalogue and pure helpers

- **Do:** Add the types above in `src/features/checklist/types.ts`. Create `src/data/settings.json` with about 15 entries covering: ChatGPT training toggle and ChatGPT memory (openai); Apple Intelligence on iOS, Apple Intelligence and Siri on macOS, Siri suggestions and analytics sharing (apple); Outlook on the web connected experiences, Windows diagnostic data, Windows Recall snapshots, Copilot in Edge (microsoft); Gemini Apps Activity, Chrome ad privacy and Web & App Activity (google); Firefox data collection and use (browser); LinkedIn "Data for Generative AI Improvement" and GitHub Copilot training-data setting (other). Write the best-known menu path for each, and set `verifiedOn` to `null` on every entry (never the build date). Write `src/features/checklist/helpers.ts`: `isStale(checkedAt, now)`, `getStatus(checks, id, now)`, `loadChecks(storage, validIds)`, `saveChecks(storage, checks)`, `filterEntries(entries, filter)`, `countByPlatform(entries)`, `toMarkdown(entries, checks, now)`. Markdown format: `# My opt-out checklist`, a line `Generated <YYYY-MM-DD>`, then one line per entry: `- [x] Product: title (last checked YYYY-MM-DD)` when checked and fresh, `- [ ] Product: title (not checked)` when unchecked, `- [ ] Product: title (last checked YYYY-MM-DD, re-check due)` when stale.
- **Files:** `src/features/checklist/types.ts`, `src/features/checklist/helpers.ts`, `src/data/settings.json`, `src/features/checklist/helpers.test.ts`
- **Satisfies:** AC1, AC3, AC5, AC10

### Task 2: Checklist slice

- **Do:** Create `checklistSlice` with state `{ checks: Checks; filter: Filter }`, initial `checks` from `loadChecks(localStorage, ids)`, initial `filter` `'all'`. Use a lazy initial state (`initialState: () => ({ ... })`) so `localStorage` is read when each store is created, not at import time, which keeps tests independent. Reducers: `toggleCheck({ id, now })` (unticked: ticks with `now` as ISO; ticked and fresh: removes the entry; ticked and stale: re-stamps to `now`), `setFilter`. Register in `combineSlices`. Persist to `localStorage` through an exported `persistChecks(store, storage)` that subscribes to the store and calls `saveChecks` when `checks` changes (not inside reducers); `main.tsx` calls it once, and tests call it with the test store so AC6 can assert the stored key. Selectors: `selectVisibleEntries`, `selectSummary(now)` returning `{ total, checked, stale }` derived from the catalogue and checks.
- **Files:** `src/features/checklist/checklistSlice.ts`, `src/app/store.ts`, `src/main.tsx`, `src/features/checklist/checklistSlice.test.ts`
- **Satisfies:** AC2, AC3, AC6, AC7, AC9, AC13

### Task 3: Checklist list UI

- **Do:** Build `ChecklistItem` (labelled checkbox, product and title, `path` in `monoClass`, `why`, "Verified <date>" in a `<time>` or "Not verified yet" when `verifiedOn` is null, optional "Official page" link with `rel="noreferrer"`) and `ChecklistList`. Cards use `cardClass`. A stale item shows a "Re-check due" badge in the `brand` accent, the only place the accent marks status; checked items show "Checked <date>" in a `<time>`. Empty state (filter matches nothing): title "Nothing here yet", body "No switches for this platform. Add one by pull request.". No loading skeleton: the catalogue is bundled, so there is no async wait.
- **Files:** `src/features/checklist/ChecklistItem.tsx`, `src/features/checklist/ChecklistList.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC2, AC3, AC6, AC7, AC8, AC14

### Task 4: Platform filter

- **Do:** `PlatformFilter`: a `role="group"` labelled "Filter by platform" of toggle buttons (`aria-pressed`), labels All, OpenAI, Apple, Microsoft, Google, Browser, Other, each with its count from `countByPlatform`. Ghost buttons; the selected one uses the `brand` selected state. Wraps at 320px, no horizontal scroll.
- **Files:** `src/features/checklist/PlatformFilter.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC4, AC8

### Task 5: Copy checklist button

- **Do:** `CopyChecklistButton` (the one `primary` Button on the screen) calls `navigator.clipboard.writeText(toMarkdown(allEntries, checks, now))`. On success shows `role="status"` text "Copied to clipboard". If the clipboard is unavailable or rejects, shows `role="alert"` "Could not copy. Select the text below instead." and reveals a read-only `<textarea>` (labelled "Checklist as Markdown") with the same text. It always copies the full list, ignoring the filter.
- **Files:** `src/features/checklist/CopyChecklistButton.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC5, AC11

### Task 6: Page shell and copy

- **Do:** Replace the template `App.tsx` body with: `text-display` headline "Privacy and AI switches worth checking again", one-line sub "Tick each switch once you have turned it off. Anything not re-checked in 30 days is flagged.", a `Summary` line "N of T checked · M to re-check" (`.tnum`, values from `selectSummary`), the filter, the list, the copy button, and a small footer note "This lists switches only. It cannot read your settings and stores nothing outside this browser." followed by a link "Suggest a change" to `https://github.com/yangxdev/opt-out-log/blob/main/src/data/settings.json`. When any entry has `verifiedOn === null`, show a one-line notice above the list: "Some paths have not been verified yet. Menus change, so check the official page when in doubt." Keep `ThemeToggle`.
- **Files:** `src/App.tsx`, `src/features/checklist/Summary.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC7, AC8, AC9, AC14

### Task 7: Health route and data integrity tests

- **Do:** Keep `GET /api/health` returning `{ ok: true }` and make sure `worker/worker.test.ts` covers it. Add a catalogue test that validates `settings.json` by rules, not by count: at least one entry, unique ids, valid `platform`, non-empty `product`, `title`, `path` and `why`, `verifiedOn` is `null` or matches `YYYY-MM-DD`, any `url` starts with `https://`. This test keeps pull-request contributions honest.
- **Files:** `worker/worker.test.ts`, `src/data/settings.test.ts`
- **Satisfies:** AC1, AC12

## Acceptance criteria

- **AC1:** Given the catalogue file, when it is loaded, then it has at least one entry, ids are unique, every `platform` is valid, every `path` is non-empty, every `verifiedOn` is `null` or `YYYY-MM-DD`, and every `url` starts with `https://`.
- **AC2:** Given no saved checks, when the page renders, then every catalogue item shows an unchecked checkbox and no "Re-check due" badge.
- **AC3:** Given system time fixed with fake timers, an item checked 31 days earlier shows "Re-check due", and one checked 29 days earlier shows "Checked <date>" and no badge. `isStale` is false at exactly 30 days and true at 30 days plus 1 ms.
- **AC4:** Given the list, when the user presses the "Apple" filter, then only Apple entries are shown, the button has `aria-pressed="true"`, and pressing "All" restores every entry. Each filter button's count equals the number of entries for that platform.
- **AC5:** Given a mix of unchecked, fresh and stale items, when `toMarkdown` runs, then the output matches the format in Task 1 with `[x]` only for fresh items.
- **AC6:** Given an unchecked item, when the user clicks its checkbox, then it becomes checked with the current date and `localStorage` key `opt-out-log:checks:v1` contains its id; clicking again unchecks it and removes the id.
- **AC7:** Given `localStorage` with saved checks, when the app loads, then those items render as checked; given corrupt JSON or unknown ids, then they are ignored and the page renders without error.
- **AC8:** Given a filter that matches no entries, when the list renders, then the empty state "Nothing here yet" is shown; and all controls are reachable by role and label.
- **AC9:** Given N catalogue entries, 3 fresh checks and 1 stale check, when the page renders, then the summary reads "4 of N checked · 1 to re-check" with N taken from the catalogue length.
- **AC10:** Given `saveChecks` then `loadChecks` on a fake storage, when round-tripped, then the same `Checks` object is returned.
- **AC11:** Given a mocked `navigator.clipboard.writeText`, when the user presses "Copy my checklist", then it is called once with the full Markdown (regardless of filter) and "Copied to clipboard" is announced; when it rejects, then an alert and the read-only textarea appear.
- **AC12:** Given a request to `GET /api/health`, when the Worker handles it, then it returns 200 with `{ ok: true }`.
- **AC13:** Given an item checked 31 days ago, when the user clicks its checkbox, then it stays checked and its timestamp becomes the current time (no longer stale).
- **AC14:** Given an entry with `verifiedOn: null`, when it renders, then it shows "Not verified yet" and the page shows the unverified notice; given an entry with a date, then it shows "Verified <date>".

## Non-goals

- Changing settings automatically, browser extension, scripts to run.
- Legal, compliance or security advice. It lists switches only.
- Accounts, sync between devices, server-side storage, or reading the user's real account state.
- Reminders by email or push notification; the flag only shows when the page is open.
- Detecting when a vendor changes a path. Entries go stale; `verifiedOn` is shown so users can judge.
- Search, sorting, custom user-added items, i18n, a second screen, routing.

## Setup notes

No storage and no secrets, so nothing is needed to deploy. Before posting the link, the owner must check every entry in `src/data/settings.json` against the live vendor UI: confirm the menu path (fix it if it moved), confirm the `url` if present, then set `verifiedOn` to that day. The Factory cannot browse, so all paths come from general knowledge, ship with `verifiedOn: null`, and show as "Not verified yet" until then. Do not launch with unverified entries, because wrong paths would undermine the tool.

## Success metric

In Cloudflare Web Analytics within 2 weeks of posting the link: at least 300 visits and a return-visitor share of 15% or more (people coming back to re-check). Ticks and copies happen client-side and are not measured, so the returning-visitor share is the proxy. Below 100 visits after posting in two communities, archive.
