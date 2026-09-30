import { SITE_NAME } from './app/site.ts';
import { ThemeToggle } from './components/ui/index.ts';
import { catalogue } from './features/checklist/checklistSlice.ts';
import { ChecklistList } from './features/checklist/ChecklistList.tsx';
import { CopyChecklistButton } from './features/checklist/CopyChecklistButton.tsx';
import { PlatformFilter } from './features/checklist/PlatformFilter.tsx';
import { Summary } from './features/checklist/Summary.tsx';

const SUGGEST_URL = 'https://github.com/yangxdev/opt-out-log/blob/main/src/data/settings.json';
const hasUnverified = catalogue.some((e) => e.verifiedOn === null);

export default function App() {
  return (
    <div className="min-h-dvh pb-[var(--safe-b)]">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="text-sm font-semibold tracking-tight text-ink">{SITE_NAME}</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-display font-semibold text-ink">
          Privacy and AI switches worth checking again
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted">
          Tick each switch once you have turned it off. Anything not re-checked in 30 days is
          flagged.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <Summary />
          <PlatformFilter />
          {hasUnverified ? (
            <p className="text-sm text-muted">
              Some paths have not been verified yet. Menus change, so check the official page when
              in doubt.
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <ChecklistList />
        </div>

        <div className="mt-8">
          <CopyChecklistButton />
        </div>

        <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
          <p>
            This lists switches only. It cannot read your settings and stores nothing outside this
            browser.
          </p>
          <p className="mt-2">
            <a
              href={SUGGEST_URL}
              target="_blank"
              rel="noreferrer"
              className="text-ink underline underline-offset-2 hover:text-brand"
            >
              Suggest a change
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
