import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
import { makeStore } from './app/store.ts';
import { catalogue, persistChecks } from './features/checklist/checklistSlice.ts';
import { toMarkdown } from './features/checklist/helpers.ts';
import { renderWithStore } from './test/render.tsx';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-06-30T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('App', () => {
  it('CH1/CH4: renders the Checklist view with header, footer note and links', () => {
    renderWithStore(<App />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Checklist');
    expect(screen.queryByText('Privacy and AI switches worth checking again')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(
      within(footer).getByText(
        'This lists switches only. It cannot read your settings and stores nothing outside this browser.',
      ),
    ).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /Suggest a change/ })).toHaveAttribute(
      'href',
      'https://github.com/yangxdev/opt-out-log/blob/main/src/data/settings.json',
    );
    expect(within(footer).getByRole('link', { name: /Source/ })).toHaveAttribute(
      'href',
      'https://github.com/yangxdev/opt-out-log',
    );
    expect(screen.getByRole('button', { name: 'Copy my checklist' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tick each switch once you have turned it off. Anything not re-checked in 30 days is flagged.',
      ),
    ).toBeInTheDocument();
  });

  it('CH2: the filter, copy button and list come after the h1, with no hero or stats', () => {
    renderWithStore(<App />);
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const h1 = screen.getByRole('heading', { level: 1 });
    const filter = screen.getByRole('group', { name: 'Filter by platform' });
    const copy = screen.getByRole('button', { name: 'Copy my checklist' });
    const first = screen.getAllByRole('checkbox')[0]!;
    expect(follows(h1, filter)).toBe(true);
    expect(follows(h1, copy)).toBe(true);
    expect(follows(h1, first)).toBe(true);
    expect(follows(filter, first)).toBe(true);
    expect(screen.queryByText('switches listed')).toBeNull();
    expect(screen.queryByText('platforms')).toBeNull();
    expect(screen.queryByText(/How it works/)).toBeNull();
  });

  it('CH6: the filter narrows rows, keeps the summary, and copy ignores the filter', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithStore(<App />);
    const summary = `0 of ${catalogue.length} checked · 0 to re-check`;
    expect(screen.getByText(summary)).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Filter by platform' });
    await user.click(within(group).getByRole('button', { name: /^Apple/ }));
    const apple = catalogue.filter((e) => e.platform === 'apple').length;
    expect(screen.getAllByRole('checkbox')).toHaveLength(apple);
    expect(screen.getByText(summary)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy my checklist' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(toMarkdown(catalogue, {}, NOW));

    writeText.mockRejectedValueOnce(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Copy my checklist' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Checklist as Markdown' })).toHaveAttribute(
      'readonly',
    );
  });

  it('CH6: a filter that matches nothing shows "Nothing here yet"', () => {
    const store = makeStore({ checklist: { checks: {}, filter: 'none' as never } });
    renderWithStore(<App />, { store });
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('CH7: stored checks render checked, the stale one is due, and ticking writes storage', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const [a, b, c] = catalogue;
    localStorage.setItem(
      'opt-out-log:checks:v1',
      JSON.stringify({ [a!.id]: ago(DAY), [b!.id]: ago(31 * DAY) }),
    );
    const store = makeStore();
    persistChecks(store, localStorage);
    renderWithStore(<App />, { store });
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).toBeChecked();
    expect(screen.getAllByText('Re-check due')).toHaveLength(1);
    await user.click(boxes[2]!);
    expect(localStorage.getItem('opt-out-log:checks:v1')).toContain(c!.id);
  });

  it('AC9: the summary reads "4 of N checked · 1 to re-check" from the catalogue length', () => {
    const [a, b, c, d] = catalogue;
    const checks = {
      [a!.id]: ago(DAY),
      [b!.id]: ago(2 * DAY),
      [c!.id]: ago(3 * DAY),
      [d!.id]: ago(31 * DAY),
    };
    renderWithStore(<App />, { store: makeStore({ checklist: { checks, filter: 'all' } }) });
    expect(
      screen.getByText(`4 of ${catalogue.length} checked · 1 to re-check`),
    ).toBeInTheDocument();
  });

  it('AC14: shows the unverified notice while any entry has verifiedOn null', () => {
    renderWithStore(<App />);
    expect(
      screen.getByText(
        'Some paths have not been verified yet. Menus change, so check the official page when in doubt.',
      ),
    ).toBeInTheDocument();
  });

  it('AC8: every control is reachable by role and label', () => {
    renderWithStore(<App />);
    expect(screen.getByRole('group', { name: 'Filter by platform' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(catalogue.length);
  });
});
