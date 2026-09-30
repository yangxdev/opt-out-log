import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
import { makeStore } from './app/store.ts';
import { catalogue } from './features/checklist/checklistSlice.ts';
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
  it('renders the headline, sub line, footer note and suggest link', () => {
    renderWithStore(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Privacy and AI switches worth checking again',
    );
    expect(
      screen.getByText(
        'Tick each switch once you have turned it off. Anything not re-checked in 30 days is flagged.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Suggest a change' })).toHaveAttribute(
      'href',
      'https://github.com/yangxdev/opt-out-log/blob/main/src/data/settings.json',
    );
    expect(screen.getByRole('button', { name: 'Copy my checklist' })).toBeInTheDocument();
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
