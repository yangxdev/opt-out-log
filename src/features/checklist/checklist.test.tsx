import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../../app/store.ts';
import { renderWithStore } from '../../test/render.tsx';
import { ChecklistItem } from './ChecklistItem.tsx';
import { ChecklistList } from './ChecklistList.tsx';
import { catalogue, persistChecks } from './checklistSlice.ts';
import { STORAGE_KEY } from './helpers.ts';

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
