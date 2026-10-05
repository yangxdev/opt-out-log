import { AppFooter, AppHeader, AppShell, ViewHeader } from './components/shell/index.ts';
import { Note } from './components/ui/index.ts';
import { catalogue } from './features/checklist/checklistSlice.ts';
import { ChecklistList } from './features/checklist/ChecklistList.tsx';
import { CopyChecklistButton } from './features/checklist/CopyChecklistButton.tsx';
import { PlatformFilter } from './features/checklist/PlatformFilter.tsx';
import { Summary } from './features/checklist/Summary.tsx';
import { STALE_AFTER_MS } from './features/checklist/helpers.ts';

const REPO_URL = 'https://github.com/yangxdev/opt-out-log';
const SUGGEST_URL = `${REPO_URL}/blob/main/src/data/settings.json`;
const hasUnverified = catalogue.some((e) => e.verifiedOn === null);
const staleDays = Math.round(STALE_AFTER_MS / (24 * 60 * 60 * 1000));

export default function App() {
  return (
    <AppShell
      header={<AppHeader />}
      footer={
        <AppFooter
          links={[
            { href: REPO_URL, label: 'Source' },
            { href: SUGGEST_URL, label: 'Suggest a change' },
          ]}
        >
          <Note>
            This lists switches only. It cannot read your settings and stores nothing outside this
            browser.
          </Note>
        </AppFooter>
      }
    >
      <ViewHeader
        title="Checklist"
        meta={<Summary />}
        actions={<CopyChecklistButton />}
        toolbar={<PlatformFilter />}
      />
      <div className="px-edge pt-6">
        <p className="text-small text-muted">
          Tick each switch once you have turned it off. Anything not re-checked in {staleDays} days
          is flagged.
        </p>
        {hasUnverified ? (
          <Note>
            Some paths have not been verified yet. Menus change, so check the official page when in
            doubt.
          </Note>
        ) : null}
      </div>
      <div className="px-edge pb-6">
        <ChecklistList />
      </div>
    </AppShell>
  );
}
