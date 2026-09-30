# opt-out-log: blueprint

> Idea: yangxdev/greenlight#1 · One-line pitch: a checklist of the privacy and AI switches that vendors hide or quietly re-enable, with the path to each one and a reminder to re-check, for privacy-minded developers and power users.

## Scope

- One screen, `/`, with the headline "Privacy and AI switches worth checking again" and a hand-curated list of 15 settings.
- Each item shows the vendor, what to turn off, the path to the switch, why it matters in one line, and the date the entry was last verified.
- Ticking an item stores "last checked" in `localStorage`. A ticked item not re-checked within 30 days is flagged with the accent colour as "Re-check due". An unticked item is neutral.
- Filter by platform: All, OpenAI, Apple, Microsoft, Google, Browser, Other.
- "Copy my checklist" copies a Markdown summary of the visible-independent full list (ticked, unticked, last checked) to the clipboard. This is the one primary button.
- No accounts, no server storage, no state sync. The list is a static JSON file in the repo, and contributions come by pull request.

## Data model

- **Storage:** browser `localStorage`, key `opt-out-log:checks:v1`, holding `Record<string, string>` (item id → ISO 8601 timestamp of last check). Theme is stored by the template's own key.
- The catalogue is static: `src/data/settings.json`, imported at build time. No MongoDB, no R2.
- Size: 15 items, well under 5 KB of `localStorage`. Unknown ids in storage are dropped on load. Invalid JSON in storage is treated as empty.
- Stale rule: `now - checkedAt > 30 days` (30 × 24 h). The reference time comes from a `now` argument so tests are deterministic.

```ts
export type Platform = 'openai' | 'apple' | 'microsoft' | 'google' | 'browser' | 'other'

export interface SettingEntry {
  id: string // kebab-case, unique, stable
  platform: Platform
  product: string // "ChatGPT"
  title: string // "Stop using my chats to train models"
  path: string // "Settings > Data controls > Improve the model for everyone"
  why: string // one plain sentence
  verifiedOn: string // ISO date (YYYY-MM-DD) when the path was last confirmed
  url?: string // official page, https only
}

export type Checks = Record<string, string> // id -> ISO 8601 last-checked timestamp

export type Filter = Platform | 'all'
```

## Routes

| Kind | Path              | Purpose                                | Request | Response         |
| ---- | ----------------- | -------------------------------------- | ------- | ---------------- |
| page | `/`               | the checklist, filter and copy button  | –       | –                |
| api  | `GET /api/health` | smoke test (keep)                      | –       | `HealthResponse` |

No router dependency: there is one screen.

## Tasks

Ordered, each finishable in under about an hour by the Factory, each ending with `npm run check` green.

### Task 1: Types, catalogue and pure helpers

- **Do:** Add the types above in `src/features/checklist/types.ts`. Create `src/data/settings.json` with exactly 15 entries covering: ChatGPT training toggle and ChatGPT memory (openai); Apple Intelligence on iOS, Apple Intelligence and Siri on macOS, Siri suggestions and analytics sharing (apple); Outlook on the web connected experiences, Windows diagnostic data, Windows Recall snapshots, Copilot in Edge (microsoft); Gemini Apps Activity, Chrome ad privacy and Web & App Activity (google); Firefox data collection and use (browser); LinkedIn "Data for Generative AI Improvement" and GitHub Copilot training-data setting (other). Use the real menu path for each and set `verifiedOn` to the date the Factory runs; the owner re-verifies before launch (see Setup notes). Write `src/features/checklist/helpers.ts`: `isStale(checkedAt, now)`, `loadChecks(storage)`, `saveChecks(storage, checks)`, `filterEntries(entries, filter)`, `toMarkdown(entries, checks, now)`. Markdown format: `# My opt-out checklist`, a line `Generated <YYYY-MM-DD>`, then one `- [x] Product: title (last checked YYYY-MM-DD)` or `- [ ] Product: title (not checked)` line per entry, `[x]` only when checked and not stale, stale lines end `(last checked YYYY-MM-DD, re-check due)`.
- **Files:** `src/features/checklist/types.ts`, `src/features/checklist/helpers.ts`, `src/data/settings.json`, `src/features/checklist/helpers.test.ts`
- **Satisfies:** AC1, AC2, AC3, AC4, AC5, AC10

### Task 2: Checklist slice

- **Do:** Create `checklistSlice` with state `{ checks: Checks; filter: Filter }`, initial `checks` from `loadChecks(localStorage)`, initial `filter` `'all'`. Reducers: `toggleCheck({ id, now })` (ticks with `now` as ISO, or removes the entry if already ticked and not stale; if ticked and stale it re-stamps to `now`), `setFilter`. Register in `combineSlices`. Persist to `localStorage` through a store subscription in `main.tsx`, not inside reducers. Selectors: `selectVisibleEntries`, `selectStatus(id, now)` returning `'unchecked' | 'checked' | 'stale'`.
- **Files:** `src/features/checklist/checklistSlice.ts`, `src/app/store.ts`, `src/main.tsx`, `src/features/checklist/checklistSlice.test.ts`
- **Satisfies:** AC2, AC3, AC6, AC7, AC9

### Task 3: Checklist list UI

- **Do:** Build `ChecklistItem` (labelled checkbox, product and title, `path` in `monoClass`, `why`, "Verified <date>" in a `<time>`, optional "Official page" link with `rel="noreferrer"`) and `ChecklistList`. Cards use `cardClass`. A `stale` item shows a "Re-check due" badge in the `brand` accent, the only place the accent marks status; checked items show "Checked <date>". Show `Skeleton` rows for the first render only if the catalogue is not yet available (it is static, so this is a guard, not a delay). Empty state (filter matches nothing): title "Nothing here yet", body "No switches for this platform. Add one by pull request.".
- **Files:** `src/features/checklist/ChecklistItem.tsx`, `src/features/checklist/ChecklistList.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC2, AC3, AC6, AC8

### Task 4: Platform filter

- **Do:** `PlatformFilter`: a `role="group"` of toggle buttons (`aria-pressed`), labels All, OpenAI, Apple, Microsoft, Google, Browser, Other, each with the entry count. Ghost buttons; the selected one uses the `brand` selected state. Wraps at 320px, no horizontal scroll.
- **Files:** `src/features/checklist/PlatformFilter.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC4, AC8

### Task 5: Copy checklist button

- **Do:** `CopyChecklistButton` (the one `primary` Button on the screen) calls `navigator.clipboard.writeText(toMarkdown(allEntries, checks, now))`. On success shows `role="status"` text "Copied to clipboard". If the clipboard is unavailable or rejects, shows `role="alert"` "Could not copy. Select the text below instead." and reveals a read-only `<textarea>` (labelled "Checklist as Markdown") with the same text. It always copies the full list, ignoring the filter.
- **Files:** `src/features/checklist/CopyChecklistButton.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC5, AC11

### Task 6: Page shell and copy

- **Do:** Replace the template `App.tsx` body with: `text-display` headline "Privacy and AI switches worth checking again", one-line sub "Tick each switch once you have turned it off. Anything not re-checked in 30 days is flagged.", a summary line "N of 15 checked · M to re-check" (`.tnum`), the filter, the list, the copy button, and a small footer note "This lists switches only. It cannot read your settings and stores nothing outside this browser." with a link to the repo's contributing instructions. Keep `ThemeToggle`. Add a short `CONTRIBUTING` section to the README describing the JSON fields (edit `README.md` only if it exists; otherwise skip and mention in the footer link to the repo's `src/data/settings.json`).
- **Files:** `src/App.tsx`, `src/features/checklist/Summary.tsx`, `src/features/checklist/checklist.test.tsx`
- **Satisfies:** AC7, AC8, AC9

### Task 7: Health route and data integrity tests

- **Do:** Keep `GET /api/health` returning `{ ok: true }` and make sure the existing `worker/worker.test.ts` covers it. Add a catalogue test that validates `settings.json`: unique ids, valid `platform`, non-empty `path`, `verifiedOn` matches `YYYY-MM-DD`, any `url` starts with `https://`. This test is what keeps pull-request contributions honest.
- **Files:** `worker/worker.test.ts`, `src/data/settings.test.ts`
- **Satisfies:** AC1, AC12

## Acceptance criteria

- **AC1:** Given the catalogue file, when it is loaded, then it has exactly 15 entries, ids are unique, every `platform` is valid, every `path` is non-empty, every `verifiedOn` is `YYYY-MM-DD`, and every `url` starts with `https://`.
- **AC2:** Given no saved checks, when the page renders, then all 15 items show unchecked checkboxes and no "Re-check due" badge.
- **AC3:** Given an item checked 31 days ago, when the page renders, then it shows "Re-check due"; given one checked 29 days ago, then it shows "Checked <date>" and no badge. `isStale` is false at exactly 30 days.
- **AC4:** Given the list, when the user presses the "Apple" filter, then only Apple entries are shown, the button has `aria-pressed="true"`, and pressing "All" restores all 15.
- **AC5:** Given a mix of unchecked, fresh and stale items, when `toMarkdown` runs, then the output matches the format in Task 1 with `[x]` only for fresh items.
- **AC6:** Given an unchecked item, when the user clicks its checkbox, then it becomes checked with today's date and `localStorage` key `opt-out-log:checks:v1` contains its id; clicking again unchecks it and removes the id.
- **AC7:** Given `localStorage` with saved checks, when the app loads, then those items render as checked; given corrupt JSON or unknown ids, then they are ignored and the page renders without error.
- **AC8:** Given a filter that matches no entries, when the list renders, then the empty state "Nothing here yet" is shown; and all controls are reachable by role and label.
- **AC9:** Given 3 fresh and 1 stale check, when the page renders, then the summary reads "4 of 15 checked · 1 to re-check".
- **AC10:** Given `saveChecks` then `loadChecks` on a fake storage, when round-tripped, then the same `Checks` object is returned.
- **AC11:** Given a mocked `navigator.clipboard.writeText`, when the user presses "Copy my checklist", then it is called once with the full Markdown (regardless of filter) and "Copied to clipboard" is announced; when it rejects, then an alert and the read-only textarea appear.
- **AC12:** Given a request to `GET /api/health`, when the Worker handles it, then it returns 200 with `{ ok: true }`.

## Non-goals

- Changing settings automatically, browser extension, scripts to run.
- Legal, compliance or security advice. It lists switches only.
- Accounts, sync between devices, server-side storage, or reading the user's real account state.
- Reminders by email or push notification; the flag only shows when the page is open.
- Detecting when a vendor changes a path. Entries go stale; `verifiedOn` is shown so users can judge.
- Search, sorting, custom user-added items, i18n, a second screen, routing.

## Setup notes

None for deploy: no storage, no secrets. Before launch the owner must open each of the 15 entries in `src/data/settings.json` and confirm the menu path against the live vendor UI, then set `verifiedOn` to that day. The Factory cannot browse, so its paths are from general knowledge and may be out of date. Stale paths would undermine the tool.

## Success metric

In Cloudflare Web Analytics within 2 weeks of posting the link: at least 300 visits and a return-visitor share of 15% or more (people coming back to re-check). Ticks and copies happen client-side and are not measured, so the returning-visitor share is the proxy. Below 100 visits after posting in two communities, archive.
