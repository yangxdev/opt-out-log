import { useAppDispatch, useAppSelector } from '../../app/hooks.ts';
import { EmptyState } from '../../components/ui/index.ts';
import { ChecklistItem } from './ChecklistItem.tsx';
import { selectChecks, selectVisibleEntries, toggleCheck } from './checklistSlice.ts';
import { getStatus } from './helpers.ts';

export function ChecklistList() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectVisibleEntries);
  const checks = useAppSelector(selectChecks);
  const now = new Date();

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        body="No switches for this platform. Add one by pull request."
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {entries.map((entry) => (
        <ChecklistItem
          key={entry.id}
          entry={entry}
          status={getStatus(checks, entry.id, now)}
          checkedAt={checks[entry.id]}
          onToggle={() => dispatch(toggleCheck({ id: entry.id, now: new Date().toISOString() }))}
        />
      ))}
    </ul>
  );
}
