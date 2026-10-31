import { Button } from './ui/Button';
import { PageControls, PAGE_SIZE } from './PageControls';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MatchedPair, compareNames, formatValue, normalizeName } from '../utils/matcher';
import {
  Search,
  CheckCircle2,
  ArrowRightLeft,
  UserMinus,
  UserPlus,
  Info,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Pencil,
  Trash2,
  Unlink,
  Link2,
  X
} from 'lucide-react';

export type DiffSortOption = 'default' | 'asc' | 'desc';

interface DiffTableProps {
  pairs: MatchedPair[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onEditPair?: (pair: MatchedPair) => void;
  onDeletePair?: (pair: MatchedPair) => void;
  onUnmatchPair?: (pair: MatchedPair) => void;
  onManualMatch?: (pair: MatchedPair) => void;
}

export const DiffTable: React.FC<DiffTableProps> = ({
  pairs,
  activeFilter,
  onFilterChange,
  onEditPair,
  onDeletePair,
  onUnmatchPair,
  onManualMatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedStatus = activeFilter;
  const setSelectedStatus = onFilterChange;
  const [page, setPage] = useState(0);
  const [sortOption, setSortOption] = useState<DiffSortOption>('default');
  useEffect(() => setPage(0), [pairs, activeFilter, searchTerm, sortOption]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const normalizedSearch = normalizeName(searchTerm);

  const filteredPairs = useMemo(() => {
    let result = pairs.filter(pair => {
      const norm1 = normalizeName(pair.row1Record?.name || '');
      const norm2 = normalizeName(pair.row2Record?.name || '');
      const normTokens = normalizeName(pair.matchedTokens.join(' '));

      const matchesSearch =
        !normalizedSearch ||
        norm1.includes(normalizedSearch) ||
        norm2.includes(normalizedSearch) ||
        normTokens.includes(normalizedSearch);

      const matchesStatus = selectedStatus === 'ALL' || pair.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    if (sortOption !== 'default') {
      const direction = sortOption === 'asc' ? 1 : -1;
      const sortKey = (pair: MatchedPair) =>
        (pair.row1Record?.name || pair.row2Record?.name || '').trim();
      // Numbers first, then letters (reversed for descending); empty names stay last.
      result = [...result].sort((a, b) => {
        const ka = sortKey(a), kb = sortKey(b);
        if (!ka || !kb) return ka ? -1 : kb ? 1 : 0;
        return direction * compareNames(ka, kb);
      });
    }

    return result;
  }, [pairs, normalizedSearch, selectedStatus, sortOption]);

  const scrollToTop = () => {
    tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: tableContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    const page = document.getElementById('app-scroll');
    page?.scrollTo({ top: page.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden diff-table relative">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search names"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-all"
            />
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              aria-label="Filter entries by status"
              className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">All Entries ({pairs.length})</option>
              <option value="IDENTICAL">Identical Records</option>
              <option value="VALUES_CHANGED">Values Changed</option>
              <option value="DATASET_A_ONLY">Dataset A Only</option>
              <option value="DATASET_B_ONLY">Dataset B Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as DiffSortOption)}
              aria-label="Sort entries"
              className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="default">Original order</option>
              <option value="asc">0–9, then A → Z</option>
              <option value="desc">Z → A, then 9–0</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-2xs">
            <Button
              onClick={scrollToTop}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 text-slate-600 dark:text-slate-300 transition-colors"
              title="Jump to Top"
              aria-label="Jump to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <Button
              onClick={scrollToBottom}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 text-slate-600 dark:text-slate-300 transition-colors"
              title="Jump to Bottom"
              aria-label="Jump to Bottom"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div ref={tableContainerRef} className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
            <tr className="text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[210px]">Dataset A</th>
              <th className="py-2.5 px-3 min-w-[210px]">Dataset B</th>
              <th className="py-2.5 px-3 min-w-[140px]">Name match</th>
              <th className="py-2.5 px-3 min-w-[150px] text-right">Difference</th>
              <th className="py-2.5 px-3 min-w-[140px] text-center">Status</th>
              <th className="py-2.5 px-3 min-w-[120px] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPairs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <Info className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">No records found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try adjusting your search query, status filter, or check Dataset A & B entries.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPairs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((pair, index) => {
                return (
                  <tr
                    key={pair.id}
                    className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/90 transition-all duration-150 ${
                      pair.status === 'VALUES_CHANGED'
                        ? 'bg-blue-50/25 dark:bg-blue-950/25'
                        : pair.status === 'DATASET_A_ONLY'
                        ? 'bg-amber-50/20 dark:bg-amber-950/15'
                        : pair.status === 'DATASET_B_ONLY'
                        ? 'bg-purple-50/15 dark:bg-purple-950/15'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {page * PAGE_SIZE + index + 1}
                    </td>

                    <td className="py-3 px-3">
                      {pair.row1Record ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {pair.row1Record.name}
                          </div>
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {formatValue(pair.row1Record.contribution)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          — No Dataset A record —
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {pair.row2Record ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {pair.row2Record.name}
                          </div>
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {formatValue(pair.row2Record.contribution)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          — Missing in Dataset B —
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {pair.row1Record && pair.row2Record ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-semibold font-mono tabular-nums ${
                                pair.nameSimilarityScore === 0
                                  ? 'name-match-zero'
                                  : 'name-match-positive'
                              }`}
                            >
                              {pair.nameSimilarityScore}%
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              ({pair.distinctSimilaritiesCount} common{' '}
                              {pair.distinctSimilaritiesCount === 1 ? 'part' : 'parts'})
                            </span>
                          </div>

                          {pair.matchedTokens.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {pair.matchedTokens.map((tok, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 capitalize font-medium"
                                >
                                  {tok}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A (Single entry)</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {pair.status === 'IDENTICAL' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50">
                          0.00
                        </span>
                      ) : pair.status === 'VALUES_CHANGED' ? (
                        <div className="flex flex-col items-end">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              pair.contributionDifference > 0
                                ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                                : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                            }`}
                          >
                            {pair.contributionDifference > 0 ? '+' : ''}
                            {formatValue(pair.contributionDifference)}
                          </span>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {pair.percentChange > 0 ? '+' : ''}
                            {pair.percentChange.toFixed(1)}% change
                          </div>
                        </div>
                      ) : pair.status === 'DATASET_A_ONLY' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50">
                          -{formatValue(pair.row1Record?.contribution || 0)}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50">
                          +{formatValue(pair.row2Record?.contribution || 0)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {pair.status === 'IDENTICAL' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100/70 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 transition-all">
                          <CheckCircle2 className="w-3 h-3" />
                          Unchanged
                        </span>
                      )}

                      {pair.status === 'VALUES_CHANGED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-100/70 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 transition-all">
                          <ArrowRightLeft className="w-3 h-3" />
                          Values Changed
                        </span>
                      )}

                      {pair.status === 'DATASET_A_ONLY' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100/70 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 transition-all">
                          <UserMinus className="w-3 h-3" />
                          Dataset A Only
                        </span>
                      )}

                      {pair.status === 'DATASET_B_ONLY' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-100/70 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 transition-all">
                          <UserPlus className="w-3 h-3" />
                          Dataset B Only
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {pair.row1Record && pair.row2Record && onUnmatchPair && (
                          <Button
                            onClick={() => onUnmatchPair(pair)}
                            className="not-match-button inline-flex items-center justify-center p-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 rounded-md transition-all active:scale-95 shadow-2xs"
                            title="Not a match: split into separate Dataset A and Dataset B entries"
                            aria-label="Not a match"
                          >
                            <Unlink className="w-3.5 h-3.5 shrink-0" />
                          </Button>
                        )}
                        {(!pair.row1Record || !pair.row2Record) && onManualMatch && (
                          <Button
                            onClick={() => onManualMatch(pair)}
                            className="match-with-button inline-flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors active:scale-95"
                            title={`Match this entry with an entry from ${pair.row1Record ? 'Dataset B' : 'Dataset A'}`}
                            aria-label="Match with another entry"
                          >
                            <Link2 className="w-4 h-4 shrink-0" />
                          </Button>
                        )}
                        <Button
                          onClick={() => onEditPair && onEditPair(pair)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors active:scale-95"
                          title="Edit record"
                          aria-label="Edit record"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => onDeletePair && onDeletePair(pair)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors active:scale-95"
                          title="Delete record"
                          aria-label="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PageControls page={page} count={filteredPairs.length} onChange={next => { setPage(next); tableContainerRef.current?.scrollTo({ top: 0 }); }} />
      <div className="p-3 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredPairs.length}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{pairs.length}</span> total entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={scrollToTop}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            <ArrowUp className="w-3 h-3" /> Back to Top
          </Button>
        </div>
      </div>
    </div>
  );
};
