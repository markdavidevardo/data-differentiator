export type DateMode = 'all' | 'day' | 'month' | 'year' | 'range';
export interface HistoryDateFilter { mode: DateMode; value: string; start: string; end: string; }
export function localDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isInvalidRange(filter: HistoryDateFilter): boolean {
  return filter.mode === 'range' && Boolean(filter.start && filter.end && filter.start > filter.end);
}
export function matchesHistoryDate(timestamp: number, filter: HistoryDateFilter): boolean {
  if (isInvalidRange(filter)) return false;
  const key = localDateKey(timestamp);
  if (filter.mode === 'range') return (!filter.start || key >= filter.start) && (!filter.end || key <= filter.end);
  if (filter.mode === 'all' || !filter.value) return true;
  if (filter.mode === 'day') return key === filter.value;
  if (filter.mode === 'month') return key.slice(0, 7) === filter.value;
  return key.slice(0, 4) === filter.value;
}
