import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import settings from '../../data/settings.json';
import { getStatus, filterEntries, loadChecks, saveChecks } from './helpers.ts';
import type { Checks, Filter, SettingEntry } from './types.ts';

export const catalogue: readonly SettingEntry[] = settings as SettingEntry[];

interface ChecklistState {
  checks: Checks;
  filter: Filter;
}

export const checklistSlice = createSlice({
  name: 'checklist',
  // Lazy, so localStorage is read when each store is created, not at import time.
  initialState: (): ChecklistState => ({
    checks: loadChecks(
      localStorage,
      catalogue.map((e) => e.id),
    ),
    filter: 'all',
  }),
  reducers: {
    toggleCheck(state, action: PayloadAction<{ id: string; now: string }>) {
      const { id, now } = action.payload;
      const status = getStatus(state.checks, id, new Date(now));
      if (status === 'checked') delete state.checks[id];
      else state.checks[id] = now; // ticks a new item, re-stamps a stale one
    },
    setFilter(state, action: PayloadAction<Filter>) {
      state.filter = action.payload;
    },
  },
  selectors: {
    selectChecks: (state) => state.checks,
    selectFilter: (state) => state.filter,
  },
});

export const { toggleCheck, setFilter } = checklistSlice.actions;
export const { selectChecks, selectFilter } = checklistSlice.selectors;

/** Memoised on the filter so the array identity is stable between renders. */
export const selectVisibleEntries = createSelector([selectFilter], (filter) =>
  filterEntries(catalogue, filter),
);

/** Summary counts derived from the catalogue and the checks. */
export function selectSummary(
  state: { checklist: ChecklistState },
  now: Date,
): { total: number; checked: number; stale: number } {
  let checked = 0;
  let stale = 0;
  for (const e of catalogue) {
    const status = getStatus(state.checklist.checks, e.id, now);
    if (status === 'checked') checked += 1;
    else if (status === 'stale') {
      checked += 1;
      stale += 1;
    }
  }
  return { total: catalogue.length, checked, stale };
}

/** Persist `checks` to storage whenever it changes (never inside reducers). */
export function persistChecks(
  store: {
    getState: () => { checklist: ChecklistState };
    subscribe: (listener: () => void) => () => void;
  },
  storage: Pick<Storage, 'setItem'>,
): () => void {
  let last = store.getState().checklist.checks;
  return store.subscribe(() => {
    const next = store.getState().checklist.checks;
    if (next !== last) {
      last = next;
      saveChecks(storage, next);
    }
  });
}
