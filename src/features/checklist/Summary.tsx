import { shallowEqual } from 'react-redux';
import { useAppSelector } from '../../app/hooks.ts';
import { selectSummary } from './checklistSlice.ts';

export function Summary() {
  const { total, checked, stale } = useAppSelector(
    (state) => selectSummary(state, new Date()),
    shallowEqual,
  );
  return (
    <p className="font-mono text-small text-ink-soft tnum">
      {checked} of {total} checked · {stale} to re-check
    </p>
  );
}
