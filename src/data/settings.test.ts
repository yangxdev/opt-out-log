import { describe, expect, it } from 'vitest';
import { PLATFORMS } from '../features/checklist/helpers.ts';
import type { SettingEntry } from '../features/checklist/types.ts';
import settings from './settings.json';

const entries = settings as SettingEntry[];

describe('settings catalogue', () => {
  it('has at least one entry and unique kebab-case ids', () => {
    expect(entries.length).toBeGreaterThan(0);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has a valid platform and non-empty text on every entry', () => {
    for (const e of entries) {
      expect(PLATFORMS).toContain(e.platform);
      for (const field of [e.product, e.title, e.path, e.why]) {
        expect(field.trim()).not.toBe('');
      }
    }
  });

  it('has verifiedOn as null or YYYY-MM-DD, and https-only urls', () => {
    for (const e of entries) {
      if (e.verifiedOn !== null) expect(e.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (e.url !== undefined) expect(e.url.startsWith('https://')).toBe(true);
    }
  });
});
