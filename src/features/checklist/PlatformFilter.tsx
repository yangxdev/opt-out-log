import { useAppDispatch, useAppSelector } from '../../app/hooks.ts';
import { Button } from '../../components/ui/index.ts';
import { catalogue, selectFilter, setFilter } from './checklistSlice.ts';
import { countByPlatform, PLATFORM_LABELS, PLATFORMS } from './helpers.ts';
import type { Filter } from './types.ts';

const OPTIONS: readonly Filter[] = ['all', ...PLATFORMS];
const counts = countByPlatform(catalogue);

export function PlatformFilter() {
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectFilter);

  return (
    <div role="group" aria-label="Filter by platform" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const selected = option === current;
        return (
          <Button
            key={option}
            size="sm"
            aria-pressed={selected}
            onClick={() => dispatch(setFilter(option))}
            className={selected ? 'border-brand bg-brand-soft text-brand hover:border-brand' : ''}
          >
            {PLATFORM_LABELS[option]} <span className="tnum text-muted">{counts[option]}</span>
          </Button>
        );
      })}
    </div>
  );
}
