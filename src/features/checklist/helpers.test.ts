import { describe, expect, it } from 'vitest';
import {
  countByPlatform,
  filterEntries,
  getStatus,
  isStale,
  loadChecks,
  saveChecks,
  STORAGE_KEY,
  toMarkdown,
} from './helpers.ts';
import type { Checks, SettingEntry } from './types.ts';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-06-30T12:00:00.000Z');
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

const entry = (id: string, platform: SettingEntry['platform']): SettingEntry => ({
  id,
  platform,
  product: `P-${id}`,
  title: `T-${id}`,
  path: 'a > b',
  why: 'because',
  verifiedOn: null,
});
const entries = [entry('a', 'apple'), entry('b', 'apple'), entry('c', 'google')];

function fakeStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe('isStale', () => {
  it('is false at exactly 30 days and true at 30 days plus 1 ms', () => {
    expect(isStale(ago(30 * DAY), now)).toBe(false);
    expect(isStale(ago(30 * DAY + 1), now)).toBe(true);
  });
});

describe('getStatus', () => {
  it('reports unchecked, checked and stale', () => {
    const checks: Checks = { a: ago(29 * DAY), b: ago(31 * DAY) };
    expect(getStatus(checks, 'a', now)).toBe('checked');
    expect(getStatus(checks, 'b', now)).toBe('stale');
    expect(getStatus(checks, 'c', now)).toBe('unchecked');
  });
});

describe('storage', () => {
  it('round-trips checks through saveChecks and loadChecks', () => {
    const storage = fakeStorage();
    const checks: Checks = { a: ago(DAY), c: ago(2 * DAY) };
    saveChecks(storage, checks);
    expect(loadChecks(storage, ['a', 'b', 'c'])).toEqual(checks);
  });

  it('drops unknown ids and treats invalid JSON as empty', () => {
    const mixed = JSON.stringify({ a: ago(DAY), zzz: ago(DAY) });
    expect(loadChecks(fakeStorage(mixed), ['a'])).toEqual({ a: ago(DAY) });
    expect(loadChecks(fakeStorage('not json'), ['a'])).toEqual({});
    expect(loadChecks(fakeStorage('[1]'), ['a'])).toEqual({});
    expect(loadChecks(fakeStorage(JSON.stringify({ a: 5 })), ['a'])).toEqual({});
  });
});

describe('filter and count', () => {
  it('filters by platform and counts each one', () => {
    expect(filterEntries(entries, 'all')).toHaveLength(3);
    expect(filterEntries(entries, 'apple').map((e) => e.id)).toEqual(['a', 'b']);
    expect(countByPlatform(entries)).toMatchObject({ all: 3, apple: 2, google: 1, openai: 0 });
  });
});

describe('toMarkdown', () => {
  it('writes [x] only for fresh items and matches the documented format', () => {
    const checks: Checks = { a: ago(DAY), b: ago(40 * DAY) };
    expect(toMarkdown(entries, checks, now)).toBe(
      [
        '# My opt-out checklist',
        '',
        'Generated 2026-06-30',
        '',
        '- [x] P-a: T-a (last checked 2026-06-29)',
        '- [ ] P-b: T-b (last checked 2026-05-21, re-check due)',
        '- [ ] P-c: T-c (not checked)',
        '',
      ].join('\n'),
    );
  });
});
