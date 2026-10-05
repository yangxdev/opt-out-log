# Build report

- **Blueprint:** blueprint.md @ 311f13a (change spec changes/10.md)
- **Greenlight issue:** yangxdev/greenlight#10
- **Run:** https://github.com/yangxdev/opt-out-log/actions/runs/37298780767
- **Result:** ✅ complete

## Tasks

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 1 | Rebuild the screen in the app shell | done | ddff074 | `App.tsx` uses AppShell/AppHeader/ViewHeader/AppFooter; Summary, ChecklistList and CopyChecklistButton adjusted for the header |
| 2 | Update tests for the new structure | done | daa28cb | Old hero-headline test replaced in `src/App.test.tsx`; CH tests added |

## Acceptance criteria

| Criterion | Covered by test | Status |
|-----------|-----------------|--------|
| CH1 | `src/App.test.tsx` › "CH1/CH4: renders the Checklist view…" | pass |
| CH2 | `src/App.test.tsx` › "CH2: the filter, copy button and list come after the h1…" | pass |
| CH3 | `src/App.test.tsx` › "AC9: the summary reads…" (unchanged) | pass |
| CH4 | `src/App.test.tsx` › "CH1/CH4: …" | pass |
| CH5 | `src/App.test.tsx` › "AC14: …" (unchanged) | pass |
| CH6 | `src/App.test.tsx` › "CH6: …" (two tests) | pass |
| CH7 | `src/App.test.tsx` › "CH7: …"; AC12 in `worker/worker.test.ts` unchanged | pass |

## Checks (last run of `npm run check`)

- lint: pass
- test: pass (63 tests)
- build: pass (bundle size: 87.5 kB JS gzip, 7.2 kB CSS gzip)

## Deviations from the blueprint

The layout is now `app` instead of `page`, as change #10 says. The only existing test changed is the old hero-headline assertion in `src/App.test.tsx`. The README needed no change.

## New dependencies

None.

## Manual setup required before deploy

None.

## Blockers / open questions

None.
