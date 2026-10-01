import { Accent, Hero, Section, SiteFooter, SiteHeader } from './components/shell/index.ts';
import { buttonClass, Cell, CellGrid, Note, Stat } from './components/ui/index.ts';
import { catalogue } from './features/checklist/checklistSlice.ts';
import { ChecklistList } from './features/checklist/ChecklistList.tsx';
import { CopyChecklistButton } from './features/checklist/CopyChecklistButton.tsx';
import { PlatformFilter } from './features/checklist/PlatformFilter.tsx';
import { Summary } from './features/checklist/Summary.tsx';
import { STALE_AFTER_MS } from './features/checklist/helpers.ts';

const REPO_URL = 'https://github.com/yangxdev/opt-out-log';
const SUGGEST_URL = `${REPO_URL}/blob/main/src/data/settings.json`;
const hasUnverified = catalogue.some((e) => e.verifiedOn === null);
const platformCount = new Set(catalogue.map((e) => e.platform)).size;
const staleDays = Math.round(STALE_AFTER_MS / (24 * 60 * 60 * 1000));

export default function App() {
  return (
    <div className="min-h-dvh">
      <SiteHeader
        nav={[
          { href: '#checklist', label: 'Checklist' },
          { href: '#how', label: 'How it works' },
        ]}
      />

      <main>
        <Hero
          eyebrow="Free · No account · Stays in this browser"
          title={
            <>
              Privacy and AI switches worth <Accent>checking</Accent> again
            </>
          }
          lede="Tick each switch once you have turned it off. Anything not re-checked in 30 days is flagged."
          actions={
            <a href="#checklist" className={buttonClass('ghost')}>
              Go to the checklist
            </a>
          }
          footnote={
            hasUnverified ? (
              <Note>
                Some paths have not been verified yet. Menus change, so check the official page when
                in doubt.
              </Note>
            ) : null
          }
          aside={
            <CellGrid columns={2} className="grid-cols-2">
              <Stat value={catalogue.length} caption="switches listed" />
              <Stat value={platformCount} caption="platforms" />
              <Stat value={staleDays} caption="days before a re-check is due" />
              <Stat value={0} caption="accounts or servers holding your ticks" />
            </CellGrid>
          }
        />

        <Section id="checklist" index="01" label="Checklist">
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <Summary />
            <CopyChecklistButton />
          </div>
          <div className="mt-8">
            <PlatformFilter />
          </div>
          <ChecklistList />
        </Section>

        <Section
          id="how"
          index="02"
          label="How it works"
          tone="zone"
          title="Settings drift. This keeps track."
          lede="Vendors add new AI and data-sharing features, and updates can switch old ones back on. A date next to each switch tells you when you last looked."
        >
          <CellGrid>
            <Cell index="01" title="Tick">
              Turn a switch off on your device, then tick it here. The date is saved in this browser
              only.
            </Cell>
            <Cell index="02" title="Re-check">
              After {staleDays} days a ticked switch is flagged as due, so you look again after
              updates.
            </Cell>
            <Cell index="03" title="Copy">
              Copy the whole list as Markdown, with your dates, to keep it or share it.
            </Cell>
          </CellGrid>
        </Section>
      </main>

      <SiteFooter
        links={[
          { href: REPO_URL, label: 'Source' },
          { href: SUGGEST_URL, label: 'Suggest a change' },
        ]}
      >
        <Note>
          This lists switches only. It cannot read your settings and stores nothing outside this
          browser.
        </Note>
      </SiteFooter>
    </div>
  );
}
