import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseBackup } from './backup.ts';

describe('parseBackup', () => {
  it('reads a backup exported by the app', () => {
    const data = parseBackup(JSON.stringify({
      version: '1',
      row1: [{ id: 'a1', name: 'Juan Cruz', contribution: 500 }],
      row2: [{ name: 'Maria', contribution: '250.5' }],
      historyList: [{ id: 'h1', timestamp: 1, title: 'x', row1Records: [], row2Records: [] }],
      rejectedPairs: ['a:::b'],
      theme: 'dark',
    }));
    assert.equal(data.row1.length, 1);
    assert.equal(data.row2[0].contribution, 250.5);
    assert.ok(data.row2[0].id);
    assert.equal(data.historyList.length, 1);
    assert.deepEqual(data.rejectedPairs, ['a:::b']);
    assert.equal(data.theme, 'dark');
  });

  it('accepts files saved with a byte-order mark', () => {
    assert.deepEqual(parseBackup('\uFEFF{"row1":[]}').row1, []);
  });

  it('rejects files that are not backups', () => {
    assert.throws(() => parseBackup('not json'), /not valid JSON/);
    assert.throws(() => parseBackup('{"foo":1}'), /not a Data Differentiator backup/);
  });
});
