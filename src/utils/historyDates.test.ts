import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesHistoryDate, isInvalidRange, type HistoryDateFilter } from './historyDates.ts';
const timestamp = (value: string) => new Date(value).getTime();
const filter = (mode: HistoryDateFilter['mode'], value = '', start = '', end = '') => ({ mode, value, start, end });
test('day filter matches only the selected local calendar day', () => {
  assert.equal(matchesHistoryDate(timestamp('2026-10-30T23:59:59'), filter('day', '2026-10-30')), true);
  assert.equal(matchesHistoryDate(timestamp('2026-10-31T00:00:00'), filter('day', '2026-10-30')), false);
});
test('month filter matches all days in the selected month', () => {
  assert.equal(matchesHistoryDate(timestamp('2026-10-31T23:59:59'), filter('month', '2026-10')), true);
  assert.equal(matchesHistoryDate(timestamp('2026-11-01T00:00:00'), filter('month', '2026-10')), false);
});
test('year filter matches the selected year, not adjacent years', () => {
  assert.equal(matchesHistoryDate(timestamp('2026-12-31T23:59:59'), filter('year', '2026')), true);
  assert.equal(matchesHistoryDate(timestamp('2027-01-01T00:00:00'), filter('year', '2026')), false);
});
test('custom ranges include both endpoint days and exclude dates outside', () => {
  const range = filter('range', '', '2026-10-01', '2026-10-30');
  assert.equal(matchesHistoryDate(timestamp('2026-10-01T00:00:00'), range), true);
  assert.equal(matchesHistoryDate(timestamp('2026-10-30T23:59:59'), range), true);
  assert.equal(matchesHistoryDate(timestamp('2026-10-31T00:00:00'), range), false);
});
test('ranges allow an open start or end and reject reversed endpoints', () => {
  assert.equal(matchesHistoryDate(timestamp('2026-01-01T12:00:00'), filter('range', '', '', '2026-10-30')), true);
  assert.equal(matchesHistoryDate(timestamp('2025-01-01T12:00:00'), filter('range', '', '2026-10-30', '')), false);
  const reversed = filter('range', '', '2026-10-30', '2026-10-01');
  assert.equal(isInvalidRange(reversed), true);
  assert.equal(matchesHistoryDate(timestamp('2026-10-15T12:00:00'), reversed), false);
});
