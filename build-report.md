# Build report

- **Blueprint:** blueprint.md @ bcaa05b
- **Greenlight issue:** yangxdev/greenlight#1
- **Run:** https://github.com/yangxdev/opt-out-log/actions/runs/36737453613
- **Result:** ✅ complete

## Tasks

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 1 | Types, catalogue and pure helpers | done | dfd2205 | 16 entries, all `verifiedOn: null` |
| 2 | Checklist slice | done | dd5984c | lazy initial state, `persistChecks` subscriber |
| 3 | Checklist list UI | done | c1679da | |
| 4 | Platform filter | done | e1395b3 | |
| 5 | Copy checklist button | done | c5773e5 | |
| 6 | Page shell and copy | done | 05e0940 | tests live in `src/App.test.tsx` |
| 7 | Health route and data integrity tests | done | a10c803 | health test renamed to AC12; catalogue test added in task 1 |

## Acceptance criteria

| Criterion | Covered by test | Status |
|-----------|-----------------|--------|
| AC1 | `src/data/settings.test.ts` | pass |
| AC2 | `src/features/checklist/checklist.test.tsx` › "AC2: …" | pass |
| AC3 | `checklist.test.tsx` › "AC3: …"; `helpers.test.ts` › "isStale" | pass |
| AC4 | `checklist.test.tsx` › "AC4: …" (two tests) | pass |
| AC5 | `helpers.test.ts` › "toMarkdown" | pass |
| AC6 | `checklist.test.tsx` › "AC6: …"; `checklistSlice.test.ts` › "persists checks…" | pass |
| AC7 | `checklist.test.tsx` › "AC7: …"; `checklistSlice.test.ts` | pass |
| AC8 | `checklist.test.tsx` › "AC8: …"; `src/App.test.tsx` › "AC8: …" | pass |
| AC9 | `src/App.test.tsx` › "AC9: …" | pass |
| AC10 | `helpers.test.ts` › "round-trips checks…" | pass |
| AC11 | `checklist.test.tsx` › "AC11: …" (three tests) | pass |
| AC12 | `worker/worker.test.ts` › "AC12: …" | pass |
| AC13 | `checklist.test.tsx` › "AC13: …" | pass |
| AC14 | `checklist.test.tsx` › "AC14: …"; `src/App.test.tsx` › "AC14: …" | pass |

## Checks (last run of `npm run check`)

- lint: pass
- test: pass (44 tests)
- build: pass (bundle size: 86.2 kB gzip JS, 5.7 kB gzip CSS)
- `npm audit --audit-level=high`: 0 vulnerabilities

## Deviations from the blueprint

- `HealthBadge` and the health slice are still in the repo but no longer shown on the page; the blueprint's single screen has no place for them. `GET /api/health` is unchanged.
- The "empty state" test forces a filter value that matches nothing, because every real platform has entries.
- `selectVisibleEntries` is a memoised `createSelector` rather than a slice selector, so the array identity is stable between renders.

## New dependencies

None

## Manual setup required before deploy

None. Before posting the link, verify every entry in `src/data/settings.json` against the live vendor UI (menu path and `url`) and set `verifiedOn` to that day. All entries ship as "Not verified yet", and the paths and help-page URLs were written from general knowledge without a browser.

## Blockers / open questions

None
