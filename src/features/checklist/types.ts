export type Platform = 'openai' | 'apple' | 'microsoft' | 'google' | 'browser' | 'other';

export interface SettingEntry {
  id: string; // kebab-case, unique, stable
  platform: Platform;
  product: string; // "ChatGPT"
  title: string; // "Stop using my chats to train models"
  path: string; // "Settings > Data controls > Improve the model for everyone"
  why: string; // one plain sentence
  verifiedOn: string | null; // YYYY-MM-DD when a person confirmed the path, null if not yet
  url?: string; // official page, https only
}

export type Checks = Record<string, string>; // id -> ISO 8601 last-checked timestamp

export type Filter = Platform | 'all';

export type Status = 'unchecked' | 'checked' | 'stale';
