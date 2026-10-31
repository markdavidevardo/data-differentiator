import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateNameSimilarity,
  differentiateGroups,
  parsePastedRecords,
  normalizeName,
  compareNames,
  type DataEntry
} from './matcher.ts';

test('exact string matching returns 100 score and EXACT confidence', () => {
  const result = evaluateNameSimilarity('Item Alpha 100', 'Item Alpha 100');
  assert.equal(result.score, 100);
  assert.equal(result.confidence, 'EXACT');
});

test('inverted string matching detects >= 2 distinct similarities', () => {
  const result = evaluateNameSimilarity('Dela Cruz, Juan M.', 'Juan Dela Cruz');
  assert.ok(result.distinctSimilaritiesCount >= 2);
  assert.ok(result.score >= 80);
});

test('string matching ignores all symbols and matches pure alphanumeric characters', () => {
  const result = evaluateNameSimilarity('Batch-A (Ref #001)', 'Batch A Ref 001');
  assert.ok(result.distinctSimilaritiesCount >= 2);
  assert.ok(result.score >= 80);
});

test('normalizeName strips all symbols leaving only alphanumeric and spaces', () => {
  const normalized = normalizeName('Product_SKU-992/X (v2.0) [ACTIVE]');
  assert.equal(normalized, 'product sku 992 x v2 0 active');
});

test('parsePastedRecords correctly parses comma thousands amounts without cutting digits (e.g. 7,800 is 7800)', () => {
  const sampleData = `Item Alpha, 7,800\nItem Beta\t12,450.50\n"Product Gamma", 7,800.00\nDelta Item 7,800`;
  const records = parsePastedRecords(sampleData);

  assert.equal(records.length, 4);
  assert.equal(records[0].name, 'Item Alpha');
  assert.equal(records[0].contribution, 7800);

  assert.equal(records[1].name, 'Item Beta');
  assert.equal(records[1].contribution, 12450.50);

  assert.equal(records[2].name, 'Product Gamma');
  assert.equal(records[2].contribution, 7800);

  assert.equal(records[3].name, 'Delta Item');
  assert.equal(records[3].contribution, 7800);
});

test('differentiateGroups correctly identifies identical, values changed, Dataset A only, and Dataset B only', () => {
  const row1: DataEntry[] = [
    { id: '1', name: 'Item Alpha', contribution: 1350 },
    { id: '2', name: 'Item Beta', contribution: 950 },
    { id: '3', name: 'Item Gamma', contribution: 1125 }, // Missing in B
  ];

  const row2: DataEntry[] = [
    { id: '10', name: 'Beta Item', contribution: 950 },  // Identical
    { id: '20', name: 'Alpha Item', contribution: 1500 }, // Changed +150
    { id: '30', name: 'Item Delta', contribution: 1100 }, // New in B
  ];

  const { pairs, summary } = differentiateGroups(row1, row2);

  assert.equal(summary.row1TotalCount, 3);
  assert.equal(summary.row2TotalCount, 3);
  assert.equal(summary.identicalCount, 1);
  assert.equal(summary.changedContributionCount, 1);
  assert.equal(summary.row1OnlyCount, 1);
  assert.equal(summary.row2OnlyCount, 1);

  const changedPair = pairs.find(p => p.status === 'VALUES_CHANGED');
  assert.equal(changedPair?.contributionDifference, 150);
});

test('name sort puts numbers first, then letters, in natural order', () => {
  const names = ['banana', '10 Corp', 'Apple', '2 Corp', 'cherry'];
  assert.deepEqual([...names].sort(compareNames), ['2 Corp', '10 Corp', 'Apple', 'banana', 'cherry']);
});

test('manual link pairs two otherwise unmatched entries', () => {
  const a = [{ id: 'a1', name: 'Juan Dela Cruz', contribution: 100 }];
  const b = [{ id: 'b1', name: 'Totally Different', contribution: 150 }];
  const auto = differentiateGroups(a, b);
  assert.equal(auto.pairs.length, 2);
  const linked = differentiateGroups(a, b, { manualPairs: { a1: 'b1' } });
  assert.equal(linked.pairs.length, 1);
  assert.equal(linked.pairs[0].matchConfidence, 'MANUAL');
  assert.equal(linked.pairs[0].contributionDifference, 50);
});
