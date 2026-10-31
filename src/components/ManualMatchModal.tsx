import React, { useMemo, useState } from 'react';
import { Link2, Search, X } from 'lucide-react';
import { Button } from './ui/Button';
import { DatasetBadge } from './DatasetBadge';
import { DataEntry, MatchedPair, compareNames, formatValue, normalizeName } from '../utils/matcher';

interface ManualMatchModalProps {
  pair: MatchedPair | null;
  /** Unmatched entries from the opposite dataset. */
  candidates: DataEntry[];
  onClose: () => void;
  onMatch: (source: MatchedPair, target: DataEntry) => void;
}

export const ManualMatchModal: React.FC<ManualMatchModalProps> = ({ pair, candidates, onClose, onMatch }) => {
  const [query, setQuery] = useState('');
  const source = pair?.row1Record || pair?.row2Record;
  const fromA = !!pair?.row1Record;
  const target = fromA ? 'B' : 'A';

  const list = useMemo(() => {
    const q = normalizeName(query);
    return candidates
      .filter(c => !q || normalizeName(c.name).includes(q))
      .sort((a, b) => compareNames(a.name, b.name));
  }, [candidates, query]);

  if (!pair || !source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/40 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Link2 className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm">Match with another entry</h3>
          </div>
          <Button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <DatasetBadge dataset={fromA ? 'A' : 'B'} size="sm" />
              Entry from Dataset {fromA ? 'A' : 'B'}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{source.name}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{formatValue(source.contribution)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <DatasetBadge dataset={target} size="sm" />
            Choose the Dataset {target} entry to match it with
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search Dataset ${target} entries`}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
            />
            {query && (
              <Button
                onClick={() => setQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 min-h-[120px]">
            {list.length === 0 ? (
              <p className="p-6 text-center text-slate-400">
                {candidates.length === 0
                  ? `There are no unmatched Dataset ${target} entries left.`
                  : 'No entries match your search.'}
              </p>
            ) : (
              list.map(c => (
                <Button
                  key={c.id}
                  onClick={() => { onMatch(pair, c); onClose(); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{formatValue(c.contribution)}</span>
                </Button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
