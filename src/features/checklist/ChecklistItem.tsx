import { cardClass, monoClass } from '../../components/ui/index.ts';
import { isoDay } from './helpers.ts';
import type { SettingEntry, Status } from './types.ts';

interface ChecklistItemProps {
  entry: SettingEntry;
  status: Status;
  checkedAt: string | undefined;
  onToggle: () => void;
}

export function ChecklistItem({ entry, status, checkedAt, onToggle }: ChecklistItemProps) {
  const inputId = `check-${entry.id}`;
  const descId = `desc-${entry.id}`;
  return (
    <li className={`${cardClass} p-4 pointer-coarse:p-5`}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={status !== 'unchecked'}
          onChange={onToggle}
          aria-describedby={descId}
          className="mt-1 size-4 shrink-0 cursor-pointer accent-brand pointer-coarse:size-6"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="block cursor-pointer">
            <span className="text-label font-medium uppercase text-muted">{entry.product}</span>
            <span className="mt-0.5 block text-base font-semibold text-ink">{entry.title}</span>
          </label>
          <div id={descId}>
            <p className={`${monoClass} mt-2 break-words text-sm text-ink-soft`}>{entry.path}</p>
            <p className="mt-2 text-sm text-muted">{entry.why}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
              {entry.verifiedOn ? (
                <span>
                  Verified <time dateTime={entry.verifiedOn}>{entry.verifiedOn}</time>
                </span>
              ) : (
                <span>Not verified yet</span>
              )}
              {checkedAt && status !== 'unchecked' ? (
                <span>
                  Checked <time dateTime={checkedAt}>{isoDay(checkedAt)}</time>
                </span>
              ) : null}
              {status === 'stale' ? (
                <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 font-medium text-brand">
                  Re-check due
                </span>
              ) : null}
              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline underline-offset-2 hover:text-brand"
                >
                  Official page
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
