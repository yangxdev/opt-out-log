import { useAppDispatch, useAppSelector } from '../../app/hooks.ts';
import { Segmented, type SegmentedOption } from '../../components/ui/index.ts';
import { catalogue, selectFilter, setFilter } from './checklistSlice.ts';
import { countByPlatform, PLATFORM_LABELS, PLATFORMS } from './helpers.ts';
import type { Filter } from './types.ts';

const counts = countByPlatform(catalogue);
const OPTIONS: readonly SegmentedOption<Filter>[] = (['all', ...PLATFORMS] as const).map(
  (value) => ({
    value,
    label: PLATFORM_LABELS[value],
    count: counts[value],
  }),
);

export function PlatformFilter() {
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectFilter);

  return (
    <Segmented
      label="Filter by platform"
      options={OPTIONS}
      value={current}
      onChange={(value) => dispatch(setFilter(value))}
    />
  );
}
