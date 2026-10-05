import { useAppDispatch, useAppSelector } from '../../app/hooks.ts';
import { EmptyState, RuledList } from '../../components/ui/index.ts';
import { ChecklistItem } from './ChecklistItem.tsx';
import { catalogue, selectChecks, selectVisibleEntries, toggleCheck } from './checklistSlice.ts';
import { getStatus } from './helpers.ts';

export function ChecklistList() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectVisibleEntries);
  const checks = useAppSelector(selectChecks);
  const now = new Date();

  if (entries.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          title="Nothing here yet"
          body="No switches for this platform. Add one by pull request."
        />
      </div>
    );
  }

  return (
    <RuledList>
      {entries.map((entry) => (
        <ChecklistItem
          key={entry.id}
          entry={entry}
          number={catalogue.indexOf(entry) + 1}
          status={getStatus(checks, entry.id, now)}
          checkedAt={checks[entry.id]}
          onToggle={() => dispatch(toggleCheck({ id: entry.id, now: new Date().toISOString() }))}
        />
      ))}
    </RuledList>
  );
}
