import { matchesHistoryDate, isInvalidRange, type DateMode } from '../utils/historyDates';
import { Button } from './ui/Button';
import React, { useState } from 'react';
import { HistorySession, deleteHistorySession, clearAllHistory } from '../utils/history';
import { formatValue } from '../utils/matcher';
import {
  History,
  X,
  Trash2,
  RotateCcw,
  Calendar,
  Search,
  ArrowUpDown,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistorySession[];
  onRefreshHistory: () => void;
  onRestoreSession: (session: HistorySession) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  historyList,
  onRefreshHistory,
  onRestoreSession,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateMode, setDateMode] = useState<DateMode>('all');
  const [dateValue, setDateValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const dateFilter = { mode: dateMode, value: dateValue, start: startDate, end: endDate };
  const clearDates = () => { setDateMode('all'); setDateValue(''); setStartDate(''); setEndDate(''); };
  const hasDateFilter = dateMode !== 'all';
  const invalidRange = isInvalidRange(dateFilter);

  const [confirmAction, setConfirmAction] = useState<
    | { type: 'restore'; session: HistorySession }
    | { type: 'delete'; session: HistorySession }
    | { type: 'clearAll' }
    | null
  >(null);

  if (!isOpen) return null;

  const filteredAndSortedHistory = historyList
    .filter(session => {
      const term = searchKeyword.toLowerCase();
      const matchesSearch =
        !term ||
        session.title.toLowerCase().includes(term) ||
        (session.notes && session.notes.toLowerCase().includes(term));

      return matchesSearch && matchesHistoryDate(session.timestamp, dateFilter);
    })
    .sort((a, b) => {
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

  const handleExecuteConfirmedAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'restore') {
      onRestoreSession(confirmAction.session);
      setConfirmAction(null);
      onClose();
    } else if (confirmAction.type === 'delete') {
      deleteHistorySession(confirmAction.session.id);
      onRefreshHistory();
      setConfirmAction(null);
    } else if (confirmAction.type === 'clearAll') {
      clearAllHistory();
      onRefreshHistory();
      setConfirmAction(null);
    }
  };

  const formattedDateFilter = dateMode === 'range' ? `${startDate || 'Any start'} – ${endDate || 'Any end'}` : dateValue || 'Any date';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] relative"
        >
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Differentiated Data History</h3>
                <p className="text-xs text-slate-300">
                  Search, filter by date, and restore previous comparison logs
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close History Modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Search history keywords..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="history-date-controls">
                <Calendar size={16}/>
                <select aria-label="Date filter mode" value={dateMode} onChange={event => { setDateMode(event.target.value as DateMode); setDateValue(''); }}>
                  <option value="all">All dates</option><option value="day">Day</option><option value="month">Month</option><option value="year">Year</option><option value="range">Date range</option>
                </select>
                {dateMode === 'range' ? <><label>From<input aria-label="Start date" type="date" value={startDate} onChange={event => setStartDate(event.target.value)}/></label><label>To<input aria-label="End date" type="date" value={endDate} onChange={event => setEndDate(event.target.value)}/></label></> : dateMode !== 'all' && <input aria-label={dateMode === 'day' ? 'Filter day' : dateMode === 'month' ? 'Filter month' : 'Filter year'} type={dateMode === 'day' ? 'date' : dateMode === 'month' ? 'month' : 'number'} min={dateMode === 'year' ? '1' : undefined} max={dateMode === 'year' ? '9999' : undefined} placeholder={dateMode === 'year' ? 'Year' : undefined} value={dateValue} onChange={event => setDateValue(event.target.value)}/>}
                {hasDateFilter && <Button title="Clear date filter" aria-label="Clear date filter" onClick={clearDates}><X size={15}/></Button>}
              </div>

              <Button
                onClick={() => setSortOrder(prev => (prev === 'newest' ? 'oldest' : 'newest'))}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Toggle sort order"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
              </Button>

              {historyList.length > 0 && (
                <Button
                  onClick={() => setConfirmAction({ type: 'clearAll' })}
                  className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium flex items-center gap-1 ml-1"
                  title="Clear all saved history logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </Button>
              )}
            </div>
          </div>

          {invalidRange && <p role="alert" className="date-range-error">End date must be on or after start date.</p>}
          {hasDateFilter && (
            <div className="px-4 py-2 bg-blue-50/70 dark:bg-blue-950/70 border-b border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>
                  Filtering activity for <strong>{formattedDateFilter}</strong> ({filteredAndSortedHistory.length} records)
                </span>
              </div>
              <Button
                onClick={() => clearDates()}
                className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 hover:underline flex items-center gap-1"
              >
                <span>All Dates</span>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            {filteredAndSortedHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2" />
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">No matching history entries</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {hasDateFilter
                    ? `No comparisons saved in ${formattedDateFilter}. Try choosing another date or reset to view all activity.`
                    : 'Try searching a different keyword or saving your current comparison to History.'}
                </p>
                {hasDateFilter && (
                  <Button
                    onClick={() => clearDates()}
                    className="mt-3 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  >
                    View All Dates
                  </Button>
                )}
              </div>
            ) : (
              filteredAndSortedHistory.map(session => {
                const isDiffZero = Math.abs(session.netVariance) < 0.01;
                const isDiffPositive = session.netVariance > 0;

                const sessionDate = new Date(session.timestamp);
                const fullDateStr = sessionDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const timeStr = sessionDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{session.title}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3" />
                          <span>{fullDateStr}</span>
                          <span className="text-slate-300">·</span>
                          <Clock className="w-3 h-3" />
                          <span>{timeStr}</span>
                        </span>
                      </div>

                      {session.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{session.notes}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <div className="font-mono text-slate-700 dark:text-slate-300">
                          <span className="text-slate-400 font-sans">Dataset A: </span>
                          <strong>{formatValue(session.row1TotalAmount)}</strong> ({session.row1Count} entries)
                        </div>
                        <span className="text-slate-300">·</span>
                        <div className="font-mono text-blue-700 dark:text-blue-300">
                          <span className="text-slate-400 font-sans">Dataset B: </span>
                          <strong>{formatValue(session.row2TotalAmount)}</strong> ({session.row2Count} entries)
                        </div>
                        <span className="text-slate-300">·</span>
                        <div className="font-mono">
                          <span className="text-slate-400 font-sans">Variance: </span>
                          <span
                            className={`font-bold ${
                              isDiffZero
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : isDiffPositive
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {isDiffPositive ? '+' : ''}
                            {formatValue(session.netVariance)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-800/60">
                          {session.identicalCount} Identical
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/60 dark:border-blue-800/60">
                          {session.changedCount} Values Changed
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60 dark:border-amber-800/60">
                          {session.row1OnlyCount} Dataset A Only
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-medium border border-purple-200/60 dark:border-purple-800/60">
                          {session.row2OnlyCount} Dataset B Only
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => setConfirmAction({ type: 'restore', session })}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                        title="Load this comparison into the workspace"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </Button>
                      <Button
                        onClick={() => setConfirmAction({ type: 'delete', session })}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        title="Delete record from history"
                        aria-label="Delete history entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span>Total Saved Logs: {historyList.length}</span>
            <Button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    confirmAction.type === 'restore'
                      ? 'bg-blue-600/30 border border-blue-400/40 text-blue-300'
                      : 'bg-red-600/30 border border-red-400/40 text-red-300'
                  }`}
                >
                  {confirmAction.type === 'restore' ? (
                    <RotateCcw className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                </div>
                <h3 className="font-bold text-sm">
                  {confirmAction.type === 'restore'
                    ? 'Restore History Session?'
                    : confirmAction.type === 'delete'
                    ? 'Delete History Record?'
                    : 'Clear All History Records?'}
                </h3>
              </div>
              <Button
                onClick={() => setConfirmAction(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {confirmAction.type === 'restore' && (
                <>
                  <p className="leading-relaxed">
                    Are you sure you want to restore <strong>"{confirmAction.session.title}"</strong>?
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    Note: This will load {confirmAction.session.row1Count} Dataset A and {confirmAction.session.row2Count} Dataset B entries into your active workspace.
                  </p>
                </>
              )}

              {confirmAction.type === 'delete' && (
                <>
                  <p className="leading-relaxed">
                    Are you sure you want to delete <strong>"{confirmAction.session.title}"</strong> from your saved comparison history?
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    Note: This record will be permanently removed from your history logs.
                  </p>
                </>
              )}

              {confirmAction.type === 'clearAll' && (
                <>
                  <p className="leading-relaxed">
                    Are you sure you want to permanently clear all <strong>{historyList.length}</strong> saved comparison history logs?
                  </p>
                  <p className="text-red-700 dark:text-red-300 text-[11px] bg-red-50 dark:bg-red-950/50 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
                    Warning: All saved history logs will be erased. This action cannot be undone.
                  </p>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteConfirmedAction}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 shadow-xs ${
                    confirmAction.type === 'restore'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmAction.type === 'restore'
                    ? 'Yes, Restore Session'
                    : confirmAction.type === 'delete'
                    ? 'Yes, Delete Record'
                    : 'Yes, Clear All History'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
