import type { Checks, Filter, Platform, SettingEntry, Status } from './types.ts';

export const STORAGE_KEY = 'opt-out-log:checks:v1';
export const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export const PLATFORMS: readonly Platform[] = [
  'openai',
  'apple',
  'microsoft',
  'google',
  'browser',
  'other',
];

export const PLATFORM_LABELS: Record<Filter, string> = {
  all: 'All',
  openai: 'OpenAI',
  apple: 'Apple',
  microsoft: 'Microsoft',
  google: 'Google',
  browser: 'Browser',
  other: 'Other',
};

/** Stale means strictly more than 30 days old; an unparseable stamp counts as stale. */
export function isStale(checkedAt: string, now: Date): boolean {
  const then = Date.parse(checkedAt);
  if (Number.isNaN(then)) return true;
  return now.getTime() - then > STALE_AFTER_MS;
}

export function getStatus(checks: Checks, id: string, now: Date): Status {
  const checkedAt = checks[id];
  if (checkedAt === undefined) return 'unchecked';
  return isStale(checkedAt, now) ? 'stale' : 'checked';
}

export function loadChecks(storage: Pick<Storage, 'getItem'>, validIds: readonly string[]): Checks {
  let parsed: unknown;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
  const valid = new Set(validIds);
  const checks: Checks = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (valid.has(id) && typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
      checks[id] = value;
    }
  }
  return checks;
}

export function saveChecks(storage: Pick<Storage, 'setItem'>, checks: Checks): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(checks));
  } catch {
    // Storage full or blocked: the checklist still works for this session.
  }
}

export function filterEntries(entries: readonly SettingEntry[], filter: Filter): SettingEntry[] {
  return filter === 'all' ? [...entries] : entries.filter((e) => e.platform === filter);
}

export function countByPlatform(entries: readonly SettingEntry[]): Record<Filter, number> {
  const counts: Record<Filter, number> = {
    all: entries.length,
    openai: 0,
    apple: 0,
    microsoft: 0,
    google: 0,
    browser: 0,
    other: 0,
  };
  for (const e of entries) counts[e.platform] += 1;
  return counts;
}

/** YYYY-MM-DD of an ISO timestamp. */
export const isoDay = (iso: string) => iso.slice(0, 10);

export function toMarkdown(entries: readonly SettingEntry[], checks: Checks, now: Date): string {
  const lines = ['# My opt-out checklist', '', `Generated ${isoDay(now.toISOString())}`, ''];
  for (const e of entries) {
    const status = getStatus(checks, e.id, now);
    const label = `${e.product}: ${e.title}`;
    const checkedAt = checks[e.id];
    if (status === 'unchecked' || checkedAt === undefined) {
      lines.push(`- [ ] ${label} (not checked)`);
    } else if (status === 'stale') {
      lines.push(`- [ ] ${label} (last checked ${isoDay(checkedAt)}, re-check due)`);
    } else {
      lines.push(`- [x] ${label} (last checked ${isoDay(checkedAt)})`);
    }
  }
  return lines.join('\n') + '\n';
}
