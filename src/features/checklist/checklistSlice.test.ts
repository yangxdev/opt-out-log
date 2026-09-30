import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../../app/store.ts';
import {
  catalogue,
  persistChecks,
  selectSummary,
  selectVisibleEntries,
  setFilter,
  toggleCheck,
} from './checklistSlice.ts';
import { STORAGE_KEY } from './helpers.ts';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-06-30T12:00:00.000Z');
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
const ids = catalogue.map((e) => e.id);

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe('checklistSlice', () => {
  it('starts unchecked with the all filter when storage is empty', () => {
    const state = makeStore().getState().checklist;
    expect(state.checks).toEqual({});
    expect(state.filter).toBe('all');
  });

  it('loads saved checks when the store is created, ignoring unknown ids', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ [ids[0]!]: ago(DAY), nope: ago(DAY) }));
    expect(makeStore().getState().checklist.checks).toEqual({ [ids[0]!]: ago(DAY) });
  });

  it('treats corrupt JSON in storage as empty', () => {
    localStorage.setItem(STORAGE_KEY, '{oops');
    expect(makeStore().getState().checklist.checks).toEqual({});
  });

  it('toggles: ticks, unticks a fresh item, and re-stamps a stale one', () => {
    const id = ids[0]!;
    const store = makeStore();
    store.dispatch(toggleCheck({ id, now: ago(0) }));
    expect(store.getState().checklist.checks[id]).toBe(ago(0));
    store.dispatch(toggleCheck({ id, now: ago(0) }));
    expect(store.getState().checklist.checks[id]).toBeUndefined();

    const stale = makeStore({ checklist: { checks: { [id]: ago(31 * DAY) }, filter: 'all' } });
    stale.dispatch(toggleCheck({ id, now: ago(0) }));
    expect(stale.getState().checklist.checks[id]).toBe(ago(0));
  });

  it('filters visible entries', () => {
    const store = makeStore();
    store.dispatch(setFilter('apple'));
    const visible = selectVisibleEntries(store.getState());
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((e) => e.platform === 'apple')).toBe(true);
  });

  it('summarises total, checked and stale from the catalogue', () => {
    const checks = {
      [ids[0]!]: ago(DAY),
      [ids[1]!]: ago(2 * DAY),
      [ids[2]!]: ago(3 * DAY),
      [ids[3]!]: ago(31 * DAY),
    };
    const store = makeStore({ checklist: { checks, filter: 'all' } });
    expect(selectSummary(store.getState(), now)).toEqual({
      total: catalogue.length,
      checked: 4,
      stale: 1,
    });
  });

  it('persists checks to localStorage when they change', () => {
    const store = makeStore();
    persistChecks(store, localStorage);
    store.dispatch(toggleCheck({ id: ids[0]!, now: ago(0) }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ [ids[0]!]: ago(0) });
    store.dispatch(toggleCheck({ id: ids[0]!, now: ago(0) }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({});
  });
});
