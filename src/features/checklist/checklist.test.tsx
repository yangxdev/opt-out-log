import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../../app/store.ts';
import { renderWithStore } from '../../test/render.tsx';
import { ChecklistItem } from './ChecklistItem.tsx';
import { ChecklistList } from './ChecklistList.tsx';
import { PlatformFilter } from './PlatformFilter.tsx';
import { catalogue, persistChecks } from './checklistSlice.ts';
import { CopyChecklistButton } from './CopyChecklistButton.tsx';
import { STORAGE_KEY, toMarkdown } from './helpers.ts';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-06-30T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const first = catalogue[0]!;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('ChecklistList', () => {
  it('AC2: with no saved checks every item is unchecked and none is flagged', () => {
    renderWithStore(<ChecklistList />);
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(catalogue.length);
    for (const box of boxes) expect(box).not.toBeChecked();
    expect(screen.queryByText('Re-check due')).not.toBeInTheDocument();
  });

  it('AC3: 31 days old shows Re-check due, 29 days old shows Checked with no badge', () => {
    const [a, b] = [catalogue[0]!, catalogue[1]!];
    const store = makeStore({
      checklist: { checks: { [a.id]: ago(31 * DAY), [b.id]: ago(29 * DAY) }, filter: 'all' },
    });
    renderWithStore(<ChecklistList />, { store });
    const stale = screen.getByRole('checkbox', { name: new RegExp(a.title) }).closest('li')!;
    const fresh = screen.getByRole('checkbox', { name: new RegExp(b.title) }).closest('li')!;
    expect(within(stale).getByText('Re-check due')).toBeInTheDocument();
    expect(within(fresh).queryByText('Re-check due')).not.toBeInTheDocument();
    expect(within(fresh).getByText('2026-06-01')).toBeInTheDocument();
    expect(within(fresh).getByText(/^Checked/)).toBeInTheDocument();
  });

  it('AC6: clicking checks with the current date and stores it; clicking again removes it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const store = makeStore();
    persistChecks(store, localStorage);
    renderWithStore(<ChecklistList />, { store });
    const box = screen.getByRole('checkbox', { name: new RegExp(first.title) });

    await user.click(box);
    expect(box).toBeChecked();
    expect(screen.getByText('2026-06-30')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toContain(first.id);

    await user.click(box);
    expect(box).not.toBeChecked();
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain(first.id);
  });

  it('AC13: clicking a stale item keeps it checked and re-stamps it to now', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const store = makeStore({
      checklist: { checks: { [first.id]: ago(31 * DAY) }, filter: 'all' },
    });
    renderWithStore(<ChecklistList />, { store });
    const box = screen.getByRole('checkbox', { name: new RegExp(first.title) });
    expect(box).toBeChecked();

    await user.click(box);
    expect(box).toBeChecked();
    expect(store.getState().checklist.checks[first.id]).toBe(NOW.toISOString());
    expect(screen.queryByText('Re-check due')).not.toBeInTheDocument();
  });

  it('AC7: saved checks render as checked; corrupt storage renders without error', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ [first.id]: ago(DAY), nope: ago(DAY) }));
    const { unmount } = renderWithStore(<ChecklistList />);
    expect(screen.getByRole('checkbox', { name: new RegExp(first.title) })).toBeChecked();
    unmount();

    localStorage.setItem(STORAGE_KEY, '{corrupt');
    renderWithStore(<ChecklistList />);
    for (const box of screen.getAllByRole('checkbox')) expect(box).not.toBeChecked();
  });

  it('AC14: shows Not verified yet for null entries and Verified <date> for dated ones', () => {
    renderWithStore(<ChecklistList />);
    expect(screen.getAllByText('Not verified yet')).toHaveLength(catalogue.length);
  });

  it('AC14: an entry with a date shows Verified <date>', () => {
    render(
      <ul>
        <ChecklistItem
          entry={{ ...first, verifiedOn: '2026-06-01' }}
          status="unchecked"
          checkedAt={undefined}
          onToggle={() => {}}
        />
      </ul>,
    );
    expect(screen.getByText(/^Verified/)).toBeInTheDocument();
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    expect(screen.queryByText('Not verified yet')).not.toBeInTheDocument();
  });

  it('AC8: a filter that matches nothing shows the empty state', () => {
    // Every real platform has entries, so force a filter value that matches none.
    const empty = makeStore({ checklist: { checks: {}, filter: 'none' as never } });
    renderWithStore(<ChecklistList />, { store: empty });
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(
      screen.getByText('No switches for this platform. Add one by pull request.'),
    ).toBeInTheDocument();
  });
});

describe('CopyChecklistButton', () => {
  const fullMarkdown = (checks = {}) => toMarkdown(catalogue, checks, NOW);

  it('AC11: copies the full Markdown once, ignoring the filter, and announces success', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const store = makeStore({ checklist: { checks: {}, filter: 'apple' } });
    renderWithStore(<CopyChecklistButton />, { store });

    await user.click(screen.getByRole('button', { name: 'Copy my checklist' }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(fullMarkdown());
    expect(await screen.findByRole('status')).toHaveTextContent('Copied to clipboard');
  });

  it('AC11: when the clipboard rejects, shows an alert and a read-only textarea', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithStore(<CopyChecklistButton />);

    await user.click(screen.getByRole('button', { name: 'Copy my checklist' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not copy. Select the text below instead.',
    );
    const area = screen.getByRole('textbox', { name: 'Checklist as Markdown' });
    expect(area).toHaveAttribute('readonly');
    expect(area).toHaveValue(fullMarkdown());
  });

  it('AC11: when the clipboard is unavailable, falls back to the textarea', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    renderWithStore(<CopyChecklistButton />);

    await user.click(screen.getByRole('button', { name: 'Copy my checklist' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Checklist as Markdown' })).toBeInTheDocument();
  });
});

describe('PlatformFilter', () => {
  it('AC4: Apple shows only Apple entries and All restores every entry', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithStore(
      <>
        <PlatformFilter />
        <ChecklistList />
      </>,
    );
    const appleCount = catalogue.filter((e) => e.platform === 'apple').length;
    const apple = screen.getByRole('button', { name: /^Apple/ });
    expect(apple).toHaveAttribute('aria-pressed', 'false');

    await user.click(apple);
    expect(apple).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('checkbox')).toHaveLength(appleCount);

    await user.click(screen.getByRole('button', { name: /^All/ }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(catalogue.length);
  });

  it('AC4: each button shows the count of entries for its platform', () => {
    renderWithStore(<PlatformFilter />);
    const group = screen.getByRole('group', { name: 'Filter by platform' });
    expect(within(group).getAllByRole('button')).toHaveLength(7);
    expect(within(group).getByRole('button', { name: /^All/ })).toHaveTextContent(
      String(catalogue.length),
    );
    const labels = { openai: 'OpenAI', apple: 'Apple', microsoft: 'Microsoft' } as const;
    for (const [platform, label] of Object.entries(labels)) {
      const n = catalogue.filter((e) => e.platform === platform).length;
      expect(within(group).getByRole('button', { name: `${label} ${n}` })).toBeInTheDocument();
    }
  });
});
