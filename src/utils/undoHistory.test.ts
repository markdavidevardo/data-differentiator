import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { emptyUndoState, recordChange, redoStep, undoStep, describeListChange, type WorkspaceSnapshot } from './undoHistory.ts';

const snap = (rejected: string[] = [], names: string[] = []): WorkspaceSnapshot => ({
  row1: names.map((name, i) => ({ id: String(i), name, contribution: 1 })),
  row2: [],
  rejectedPairs: rejected,
});

describe('undo history', () => {
  it('undoes and redoes a "Not Match" action', () => {
    const before = snap();
    const after = snap(['a:::b']);
    let state = recordChange(emptyUndoState(), before, 'Marked as not a match', 0);

    const undone = undoStep(state, after, 10)!;
    assert.deepEqual(undone.restore.rejectedPairs, []);
    assert.equal(undone.label, 'Marked as not a match');
    state = undone.state;

    const redone = redoStep(state, before, 20)!;
    assert.deepEqual(redone.restore.rejectedPairs, ['a:::b']);
    assert.equal(redone.state.past.length, 1);
    assert.equal(redone.state.future.length, 0);
  });

  it('merges quick repeats of the same edit into one step', () => {
    let state = recordChange(emptyUndoState(), snap([], ['A']), 'Edited Dataset A', 0);
    state = recordChange(state, snap([], ['Ab']), 'Edited Dataset A', 500);
    assert.equal(state.past.length, 1);
    assert.equal(state.past[0].snapshot.row1[0].name, 'A');
  });

  it('a new action clears the redo list', () => {
    let state = recordChange(emptyUndoState(), snap(), 'one', 0);
    state = undoStep(state, snap(['x']), 1)!.state;
    assert.equal(state.future.length, 1);
    state = recordChange(state, snap(), 'two', 5000);
    assert.equal(state.future.length, 0);
  });

  it('returns null when there is nothing to undo or redo', () => {
    assert.equal(undoStep(emptyUndoState(), snap()), null);
    assert.equal(redoStep(emptyUndoState(), snap()), null);
  });

  it('describes list changes', () => {
    const one = snap([], ['A']).row1;
    const two = snap([], ['A', 'B']).row1;
    assert.equal(describeListChange('Dataset A', one, two), 'Added 1 entry to Dataset A');
    assert.equal(describeListChange('Dataset A', two, []), 'Cleared Dataset A');
  });
});

it('edits to different entries get separate undo steps even when typed quickly', () => {
  let s = recordChange(emptyUndoState(), snap(), 'Edited A', 1000, 'edit:row1:a:name');
  s = recordChange(s, snap(), 'Edited B', 1100, 'edit:row1:b:name');
  s = recordChange(s, snap(), 'Edited B', 1200, 'edit:row1:b:name');
  assert.equal(s.past.length, 2);
});
