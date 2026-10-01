import {
  Checkbox,
  chipClass,
  indexClass,
  linkClass,
  monoClass,
} from '../../components/ui/index.ts';
import { RuledItem } from '../../components/ui/RuledList.tsx';
import { isoDay } from './helpers.ts';
import type { SettingEntry, Status } from './types.ts';

interface ChecklistItemProps {
  entry: SettingEntry;
  /** 1-based position in the full catalogue, so numbers stay put when a filter hides rows. */
  number?: number;
  status: Status;
  checkedAt: string | undefined;
  onToggle: () => void;
}

export function ChecklistItem({ entry, number, status, checkedAt, onToggle }: ChecklistItemProps) {
  const inputId = `check-${entry.id}`;
  const descId = `desc-${entry.id}`;
  return (
    <RuledItem
      meta={
        <>
          {number === undefined ? null : (
            <p className={indexClass}>{String(number).padStart(2, '0')}</p>
          )}
          <p>{entry.product}</p>
        </>
      }
      aside={
        status === 'stale' ? (
          <span className={`${chipClass} border-brand text-brand`}>Re-check due</span>
        ) : null
      }
    >
      <div className="flex items-start gap-4">
        <Checkbox
          id={inputId}
          checked={status !== 'unchecked'}
          onChange={onToggle}
          aria-describedby={descId}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="block cursor-pointer text-h3 font-semibold text-ink">
            <span className="sr-only">{entry.product}: </span>
            {entry.title}
          </label>
          <div id={descId}>
            <p className={`${monoClass} mt-2 text-small break-words text-ink-soft`}>{entry.path}</p>
            <p className="mt-2 text-small text-muted">{entry.why}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-label uppercase text-muted">
              {entry.verifiedOn ? (
                <span>
                  Verified <time dateTime={entry.verifiedOn}>{entry.verifiedOn}</time>
                </span>
              ) : (
                <span>Not verified yet</span>
              )}
              {checkedAt && status !== 'unchecked' ? (
                <span className="text-ink-soft">
                  Checked <time dateTime={checkedAt}>{isoDay(checkedAt)}</time>
                </span>
              ) : null}
              {entry.url ? (
                <a href={entry.url} target="_blank" rel="noreferrer" className={linkClass}>
                  Official page<span aria-hidden="true"> ↗</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </RuledItem>
  );
}
