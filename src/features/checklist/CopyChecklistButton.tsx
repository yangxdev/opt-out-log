import { useState } from 'react';
import { LuCopy } from 'react-icons/lu';
import { useAppSelector } from '../../app/hooks.ts';
import { Button, inputClass, labelClass } from '../../components/ui/index.ts';
import { catalogue, selectChecks } from './checklistSlice.ts';
import { toMarkdown } from './helpers.ts';

type CopyState = { kind: 'idle' } | { kind: 'copied' } | { kind: 'failed'; text: string };

/** The one primary button. Always copies the full list, ignoring the filter. */
export function CopyChecklistButton() {
  const checks = useAppSelector(selectChecks);
  const [state, setState] = useState<CopyState>({ kind: 'idle' });

  async function copy() {
    const text = toMarkdown(catalogue, checks, new Date());
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setState({ kind: 'copied' });
    } catch {
      setState({ kind: 'failed', text });
    }
  }

  return (
    <div>
      <Button variant="primary" onClick={() => void copy()}>
        <LuCopy className="size-4" aria-hidden />
        Copy my checklist
      </Button>
      {state.kind === 'copied' ? (
        <p role="status" className="mt-2 font-mono text-label uppercase text-muted">
          Copied to clipboard
        </p>
      ) : null}
      {state.kind === 'failed' ? (
        <div className="mt-3">
          <p role="alert" className="text-small text-danger">
            Could not copy. Select the text below instead.
          </p>
          <label className="mt-3 block">
            <span className={labelClass}>Checklist as Markdown</span>
            <textarea
              readOnly
              rows={8}
              value={state.text}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass} mt-1.5 font-mono text-small`}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
